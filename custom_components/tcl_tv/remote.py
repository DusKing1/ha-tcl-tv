"""Full key set of the TCL phone remote as a remote entity."""
from __future__ import annotations

import asyncio
from collections.abc import Iterable
from typing import Any

from homeassistant.components.remote import (
    ATTR_DELAY_SECS,
    ATTR_NUM_REPEATS,
    DEFAULT_DELAY_SECS,
    RemoteEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import TclTvConfigEntry
from .entity import TclTvEntity, tv_errors
from .protocol import KEYS


async def async_setup_entry(
    hass: HomeAssistant,
    entry: TclTvConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([TclTvRemote(entry.runtime_data, entry, "remote")])


class TclTvRemote(TclTvEntity, RemoteEntity):
    """``remote.send_command`` takes key names from ``protocol.KEYS``."""

    _attr_name = None

    @property
    def is_on(self) -> bool | None:
        return self.hub.connected if self.hub.probed else None

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.hub.async_turn_on()

    async def async_turn_off(self, **kwargs: Any) -> None:
        with tv_errors():
            await self.hub.async_turn_off()

    async def async_send_command(self, command: Iterable[str], **kwargs: Any) -> None:
        names = list(command)
        unknown = [name for name in names if name not in KEYS]
        if unknown:
            raise ServiceValidationError(
                f"Unknown TCL key(s) {', '.join(unknown)}; valid keys: {', '.join(KEYS)}"
            )
        repeats: int = kwargs.get(ATTR_NUM_REPEATS, 1)
        delay: float = kwargs.get(ATTR_DELAY_SECS, DEFAULT_DELAY_SECS)
        with tv_errors():
            client = self.hub.require_client()
            for i in range(repeats):
                for j, name in enumerate(names):
                    if i or j:
                        await asyncio.sleep(delay)
                    await client.send_key(KEYS[name])
        if any(name in ("volume_up", "volume_down") for name in names):
            with tv_errors():
                await self.hub.async_refresh_volume()
