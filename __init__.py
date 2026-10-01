"""TCL TV control over the TCL+/T-Cast LAN remote protocol (TCP 6553)."""
from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, PLATFORMS
from .hub import TclTvHub

type TclTvConfigEntry = ConfigEntry[TclTvHub]
CARD_URL = "/tcl_tv_static/tcl-ipod-card.js?v=0.2.0"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve and load the bundled iPod-style Lovelace card."""
    component_dir = Path(__file__).parent
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                "/tcl_tv_static",
                str(component_dir / "static"),
                False,
            )
        ]
    )
    frontend.add_extra_js_url(hass, CARD_URL)
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
