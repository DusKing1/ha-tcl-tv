"""TCL TV LAN remote protocol (TCL+ / T-Cast "tnscreen" SDK).

No Home Assistant imports: this module is exercised directly against the TV.

Wire format (verified on TCL 75Q9M Pro, discovery protocol 14):
- UDP 6537 discovery: ``1:<ts_ms>:<name>:PHONE:1:<name>:<id>:0:0\\0`` answered by
  ``14:<ts>:<tv name>:TV:<cmd>:<name>:<55-char caps>:0:<mac>:<p2pMac>:<activeMac>``
  with ``:`` inside MACs escaped as ``&#058``.
- TCP 6553: every frame is a 4-byte big-endian length + body; fields use ``>>``.
- ``159`` identity exchange is plaintext. Reply field 6 is the algorithm; ``1``
  means every later body is AES-128-CBC/PKCS7 with a fixed key and IV.
- The TV closes a link after ~20 s without traffic; ``150>>`` keeps it alive.
"""
from __future__ import annotations

import asyncio
from collections import deque
from collections.abc import Callable
import contextlib
from dataclasses import dataclass
import logging
import struct
import time
import uuid

from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

_LOGGER = logging.getLogger(__name__)

CONTROL_PORT = 6553
DISCOVERY_PORT = 6537
WOL_PORTS = (7778, 9)  # 7778 is what the TCL app uses; 9 is the WOL convention

_AES_KEY = b"tnscreentnscreen"
_AES_IV = bytes.fromhex("1234567890abcdef1234567890abcdef")
_SEP = ">>"
_MAX_FRAME = 1 << 20

HEARTBEAT_IDLE = 5.0  # send 150>> when nothing was written for this long
SILENCE_TIMEOUT = 20.0  # drop the link when the TV said nothing for this long

# 149>><code>; names follow IpMessageConst.TR_KEY_* in the TCL SDK.
KEYS: dict[str, int] = {
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    "6": 6, "7": 7, "8": 8, "9": 9, "0": 10,
    "up": 11,
    "down": 12,
    "left": 13,
    "right": 14,
    "ok": 15,
    "back": 16,
    "3d": 17,
    "menu": 18,
    "home": 19,
    "power": 20,
    "volume_up": 21,
    "volume_down": 22,
    "mute": 23,
    "epg": 24,
    "display": 25,
    "playback": 26,
    "channel_up": 27,
    "channel_down": 28,
    "source": 29,
    "scale": 30,
    "picture": 31,
    "favorite": 32,
    "search": 33,
    "red": 34,
    "green": 35,
    "yellow": 36,
    "blue": 37,
    "backspace": 38,
    "mouse_left": 39,
    "mouse_right": 40,
    "info": 41,
    "smart_tv": 45,
    "enter": 68,
    "dot": 75,
}


class TclTvError(Exception):
    """Protocol or transport failure talking to the TV."""


@dataclass(frozen=True, slots=True)
class TvIdentity:
    """UDP discovery answer."""

    name: str
    protocol_version: int
    mac: str
    active_mac: str


@dataclass(frozen=True, slots=True)
class TvInfo:
    """TCP 159 handshake answer."""

    model: str
    app_version: str
    software_version: str
    mac: str
    algorithm: int


@dataclass(frozen=True, slots=True)
class TvApp:
    """Launchable app reported by ``223>>GET``."""

    package: str
    name: str
    system: bool


def _encrypt(data: bytes) -> bytes:
    padder = padding.PKCS7(128).padder()
    enc = Cipher(algorithms.AES(_AES_KEY), modes.CBC(_AES_IV)).encryptor()
    return enc.update(padder.update(data) + padder.finalize()) + enc.finalize()


def _decrypt(data: bytes) -> bytes:
    dec = Cipher(algorithms.AES(_AES_KEY), modes.CBC(_AES_IV)).decryptor()
    unpadder = padding.PKCS7(128).unpadder()
    plain = dec.update(data) + dec.finalize()
    return unpadder.update(plain) + unpadder.finalize()


def _decode(body: bytes) -> str:
    """Decode a frame body whichever way the TV chose to send it.

    The TV does not stick to the negotiated mode: the push it sends right after
    accept (``253>>1>>0``) arrives in plaintext on one connection and encrypted
    on the next, so every block-sized body is tried as ciphertext first.
    """
    if body and len(body) % 16 == 0:
        with contextlib.suppress(ValueError):
            plain = _decrypt(body)
            if plain[:1].isdigit():
                return plain.decode("utf-8", "replace")
    return body.decode("utf-8", "replace")


def _decode_mac(raw: str) -> str:
    return raw.replace("&#058", ":").lower()


def parse_discovery(data: bytes) -> TvIdentity | None:
    """Parse a TV's UDP 6537 answer; ``None`` for anything else."""
    fields = data.rstrip(b"\0").decode("utf-8", "replace").split(":")
    if len(fields) < 11 or fields[3] != "TV":
        return None
    try:
        version = int(fields[0])
    except ValueError:
        return None
    return TvIdentity(
        name=fields[2],
        protocol_version=version,
        mac=_decode_mac(fields[8]),
        active_mac=_decode_mac(fields[10]),
    )


class _DiscoveryProtocol(asyncio.DatagramProtocol):
    def __init__(self, host: str, answer: asyncio.Future[TvIdentity]) -> None:
        self._host = host
        self._answer = answer

    def datagram_received(self, data: bytes, addr: tuple[str, int]) -> None:
        if addr[0] != self._host or self._answer.done():
            return
        if (identity := parse_discovery(data)) is not None:
            self._answer.set_result(identity)


async def async_probe(host: str, timeout: float = 3.0) -> TvIdentity:
    """Unicast a discovery announcement to ``host`` and return its identity."""
    loop = asyncio.get_running_loop()
    answer: asyncio.Future[TvIdentity] = loop.create_future()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: _DiscoveryProtocol(host, answer), local_addr=("0.0.0.0", 0)
    )
    me = f"ha-{uuid.uuid4().hex[:12]}"
    packet = f"1:{int(time.time() * 1000)}:{me}:PHONE:1:{me}:{me}:0:0\0".encode()
    try:
        transport.sendto(packet, (host, DISCOVERY_PORT))
        async with asyncio.timeout(timeout):
            return await answer
    except TimeoutError as err:
        raise TclTvError(f"{host} did not answer TCL discovery on UDP {DISCOVERY_PORT}") from err
    finally:
        transport.close()


async def async_wake(macs: list[str], repeats: int = 5) -> None:
    """Broadcast Wake-on-LAN for every MAC, the way the TCL app does (5 x 1 s)."""
    payloads = [b"\xff" * 6 + bytes.fromhex(mac.replace(":", "")) * 16 for mac in macs]
    loop = asyncio.get_running_loop()
    transport, _ = await loop.create_datagram_endpoint(
        asyncio.DatagramProtocol, local_addr=("0.0.0.0", 0), allow_broadcast=True
    )
    try:
        for attempt in range(repeats):
            for payload in payloads:
                for port in WOL_PORTS:
                    transport.sendto(payload, ("255.255.255.255", port))
            if attempt < repeats - 1:
                await asyncio.sleep(1)
    finally:
        transport.close()


class TclTvClient:
    """One authenticated TCP 6553 control session."""

    def __init__(
        self,
        host: str,
        client_name: str,
        client_id: str,
        on_disconnect: Callable[[], None] | None = None,
    ) -> None:
        self.host = host
        self._client_name = client_name
        self._client_id = client_id
        self._on_disconnect = on_disconnect
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._encrypted = False
        self._pending: dict[str, deque[asyncio.Future[str]]] = {}
        self._tasks: list[asyncio.Task[None]] = []
        self._last_tx = 0.0
        self._last_rx = 0.0
        self._closed = False

    @property
    def connected(self) -> bool:
        return self._writer is not None and not self._closed

    async def connect(self, timeout: float = 5.0) -> TvInfo:
        """Open the socket, run the 159 identity exchange, start keepalive."""
        try:
            async with asyncio.timeout(timeout):
                self._reader, self._writer = await asyncio.open_connection(
                    self.host, CONTROL_PORT
                )
                self._write(f"159>>{self._client_name}>>1>>{self._client_id}>>1", plain=True)
                while True:
                    text = _decode(await self._read_frame())
                    if text.startswith("159" + _SEP):
                        break
                    # The TV pushes e.g. ``253>>1>>0`` right after accept.
                    _LOGGER.debug("%s pre-handshake frame: %s", self.host, text[:80])
        except (OSError, TimeoutError, asyncio.IncompleteReadError, TclTvError) as err:
            await self.close()
            raise TclTvError(f"cannot open TCL control session to {self.host}: {err!r}") from err
        except asyncio.CancelledError:
            await self.close()
            raise

        fields = text.split(_SEP)
        if len(fields) < 7:
            await self.close()
            raise TclTvError(f"short 159 reply from {self.host}: {fields!r}")
        info = TvInfo(
            model=fields[1],
            app_version=fields[2].partition(":")[2] or fields[2],
            software_version=fields[3],
            mac=fields[5].lower(),
            algorithm=int(fields[6]) if fields[6].isdigit() else -1,
        )
        self._encrypted = info.algorithm == 1
        self._last_rx = time.monotonic()
        loop = asyncio.get_running_loop()
        self._tasks = [
            loop.create_task(self._read_loop(), name=f"tcl_tv read {self.host}"),
            loop.create_task(self._keepalive_loop(), name=f"tcl_tv keepalive {self.host}"),
        ]
        return info

    async def close(self) -> None:
        """Tear the session down; ``on_disconnect`` fires only for established links."""
        if self._closed:
            return
        self._closed = True
        established = bool(self._tasks)
        current = asyncio.current_task()
        for task in self._tasks:
            if task is not current:
                task.cancel()
        for queue in self._pending.values():
            for fut in queue:
                if not fut.done():
                    fut.set_exception(TclTvError("connection closed"))
        self._pending.clear()
        if self._writer is not None:
            self._writer.close()
            with contextlib.suppress(OSError):
                await self._writer.wait_closed()
        if established and self._on_disconnect is not None:
            self._on_disconnect()

    # ---- commands -------------------------------------------------------

    async def send_key(self, code: int) -> None:
        await self._send(f"149>>{code}")

    async def get_volume(self) -> int:
        reply = await self._request("136>>", "130")
        return int(reply.split(_SEP)[1])

    async def set_volume(self, level: int) -> None:
        await self._send(f"130>>{level}")

    async def get_apps(self) -> list[TvApp]:
        # The TV computes package sizes before answering: several seconds.
        reply = await self._request("223>>GET", "223", timeout=15.0)
        _, _, records = reply.partition(f"223{_SEP}GET{_SEP}")
        apps: list[TvApp] = []
        for record in records.split(">"):
            parts = record.split("::")
            if len(parts) < 2 or not parts[0]:
                continue
            apps.append(
                TvApp(package=parts[0], name=parts[1], system=len(parts) > 8 and parts[8] == "0")
            )
        return apps

    async def launch_app(self, package: str) -> None:
        await self._send(f"223>>OPEN>>{package}")

    # ---- transport ------------------------------------------------------

    def _write(self, text: str, plain: bool = False) -> None:
        if self._writer is None or self._closed:
            raise TclTvError("not connected")
        body = text.encode()
        if self._encrypted and not plain:
            body = _encrypt(body)
        # One write() per frame keeps frames atomic without a lock.
        self._writer.write(struct.pack(">I", len(body)) + body)
        self._last_tx = time.monotonic()

    async def _send(self, text: str) -> None:
        self._write(text)
        try:
            await self._writer.drain()  # type: ignore[union-attr]
        except OSError as err:
            await self.close()
            raise TclTvError(f"send to {self.host} failed: {err!r}") from err

    async def _request(self, text: str, reply_id: str, timeout: float = 5.0) -> str:
        fut: asyncio.Future[str] = asyncio.get_running_loop().create_future()
        queue = self._pending.setdefault(reply_id, deque())
        queue.append(fut)
        try:
            await self._send(text)
            async with asyncio.timeout(timeout):
                return await fut
        except TimeoutError as err:
            raise TclTvError(f"{self.host} did not answer {text!r}") from err
        finally:
            with contextlib.suppress(ValueError):
                queue.remove(fut)

    async def _read_frame(self) -> bytes:
        assert self._reader is not None
        (length,) = struct.unpack(">I", await self._reader.readexactly(4))
        if length >= _MAX_FRAME:
            raise TclTvError(f"oversized frame ({length} bytes)")
        return await self._reader.readexactly(length)

    async def _read_loop(self) -> None:
        try:
            while True:
                text = _decode(await self._read_frame())
                self._last_rx = time.monotonic()
                reply_id = text.split(_SEP, 1)[0]
                queue = self._pending.get(reply_id)
                while queue:
                    fut = queue.popleft()
                    if not fut.done():
                        fut.set_result(text)
                        break
                else:
                    if reply_id != "150":  # keepalive answers "150>>YES"
                        _LOGGER.debug("%s unsolicited: %s", self.host, text[:120])
        except (OSError, asyncio.IncompleteReadError, TclTvError) as err:
            _LOGGER.debug("%s read loop ended: %r", self.host, err)
        finally:
            await self.close()

    async def _keepalive_loop(self) -> None:
        while True:
            await asyncio.sleep(1)
            now = time.monotonic()
            if now - self._last_rx > SILENCE_TIMEOUT:
                _LOGGER.debug("%s silent for %.0fs, dropping link", self.host, now - self._last_rx)
                await self.close()
                return
            if now - self._last_tx >= HEARTBEAT_IDLE:
                try:
                    await self._send("150>>")
                except TclTvError:
                    return
