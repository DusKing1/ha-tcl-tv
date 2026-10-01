"""TCL TV control over the TCL+/T-Cast LAN remote protocol (TCP 6553)."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN, PLATFORMS
from .hub import TclTvHub

type TclTvConfigEntry = ConfigEntry[TclTvHub]

_LOGGER = logging.getLogger(__name__)
CARD_PATH = "/tcl_tv_static/tcl-ipod-card.js"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the card and register it in the dashboard's resource collection."""
    component_dir = Path(__file__).parent
    integration = await async_get_integration(hass, DOMAIN)
    card_url = f"{CARD_PATH}?v={integration.version}"
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                "/tcl_tv_static",
                str(component_dir / "static"),
                False,
            )
        ]
    )
    resources = hass.data[LOVELACE_DATA].resources
    # Loading via the HTML bootstrap alone misses clients that reuse that page.
    # Lovelace resources are fetched separately and work without the extra import.
    if isinstance(resources, ResourceStorageCollection):
        await resources.async_get_info()  # Ensure persisted resources are loaded.
        matches = [
            item for item in resources.async_items()
            if item["url"].split("?", 1)[0] == CARD_PATH
        ]
        resource = {"url": card_url, "res_type": "module"}
        if matches:
            if matches[0]["url"] != card_url or matches[0]["type"] != "module":
                await resources.async_update_item(matches[0]["id"], resource)
            for duplicate in matches[1:]:
                await resources.async_delete_item(duplicate["id"])
        else:
            await resources.async_create_item(resource)
    elif not any(
        item["url"] == card_url and item["type"] == "module"
        for item in resources.async_items()
    ):
        _LOGGER.warning(
            "Lovelace resources are YAML-managed: add url: %s with type: module",
            card_url,
        )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: TclTvConfigEntry) -> bool:
    hub = TclTvHub(entry)
    entry.runtime_data = hub
    # A powered-off TV is a normal state, not a setup failure: entities report
    # "off" until the session comes up.
    entry.async_create_background_task(hass, hub.async_run(), f"tcl_tv {hub.host}")
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: TclTvConfigEntry) -> bool:
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded and entry.runtime_data.client is not None:
        await entry.runtime_data.client.close()
    return unloaded
