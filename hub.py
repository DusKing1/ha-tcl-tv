"""Keeps one TCP control session to the TV alive and fans state out to entities."""
from __future__ import annotations

import asyncio
from collections.abc import Callable
import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST
from homeassistant.core import CALLBACK_TYPE, callback

from .const import (
    CLIENT_NAME,
    CONF_ACTIVE_MAC,
    CONF_CLIENT_ID,
    CONF_MAC,
    RECONNECT_INTERVAL,
    VOLUME_POLL_INTERVAL,
)
from .protocol import TclTvClient, TclTvError, TvApp, async_wake

_LOGGER = logging.getLogger(__name__)


class TclTvHub:
    """Connection supervisor; "connected" is the only power signal the TV offers."""

    def __init__(self, entry: ConfigEntry) -> None:
        self.host: str = entry.data[CONF_HOST]
        self._client_id: str = entry.data[CONF_CLIENT_ID]
        self._wake_macs = list(dict.fromkeys([entry.data[CONF_ACTIVE_MAC], entry.data[CONF_MAC]]))
        self.client: TclTvClient | None = None
        self.volume: int | None = None
        self.apps: list[TvApp] = []
        # False until the first connect attempt settles, so a restart does not
        # record a spurious off -> on transition.
        self.probed = False
        # Set when HA stops or unloads the entry: the socket closing then is not
        # the TV powering off and must not be recorded as "off".
        self._stopping = False
        self._listeners: list[CALLBACK_TYPE] = []
        self._retry_now = asyncio.Event()

    @property
    def connected(self) -> bool:
        return self.client is not None and self.client.connected

    @callback
    def async_add_listener(self, update: CALLBACK_TYPE) -> Callable[[], None]:
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    @callback
    def _notify(self) -> None:
        if self._stopping:
            return
        for update in list(self._listeners):
            update()

    async def async_run(self) -> None:
        """Entry-lifetime loop: connect, poll volume, reconnect after drops."""
        while True:
            client = TclTvClient(self.host, CLIENT_NAME, self._client_id, on_disconnect=self._notify)
            try:
                await client.connect()
            except TclTvError as err:
                _LOGGER.debug("TV %s not reachable: %s", self.host, err)
                if not self.probed:
                    self.probed = True
                    self._notify()
            else:
                _LOGGER.debug("TV %s connected", self.host)
                self.client = client
                self.probed = True
                self._notify()
                try:
                    await self._session(client)
                except asyncio.CancelledError:
                    # HA cancels this task on stop/unload; hass.is_stopping is
                    # not yet True then (a restart still recorded "off" with it).
                    self._stopping = True
                    raise
                finally:
                    await client.close()
                    self.client = None
                    self._notify()
            self._retry_now.clear()
            try:
                async with asyncio.timeout(RECONNECT_INTERVAL):
                    await self._retry_now.wait()
            except TimeoutError:
                pass

    async def _session(self, client: TclTvClient) -> None:
        try:
            self.apps = await client.get_apps()
        except TclTvError as err:
            _LOGGER.warning("TV %s did not list its apps: %s", self.host, err)
        else:
            self._notify()
        while client.connected:
            try:
                volume = await client.get_volume()
            except TclTvError:
                return
            if volume != self.volume:
                self.volume = volume
                self._notify()
            await asyncio.sleep(VOLUME_POLL_INTERVAL)

    def require_client(self) -> TclTvClient:
        if self.client is None or not self.client.connected:
            raise TclTvError(f"TV {self.host} is off or unreachable")
        return self.client

    async def async_refresh_volume(self) -> None:
        client = self.require_client()
        self.volume = await client.get_volume()
        self._notify()

    async def async_turn_on(self) -> None:
        if self.connected:
            return
        await async_wake(self._wake_macs)
        self._retry_now.set()

    async def async_turn_off(self) -> None:
        # POWER is a toggle; only send it while the TV is known to be on.
        if self.connected:
            await self.require_client().send_key(20)
