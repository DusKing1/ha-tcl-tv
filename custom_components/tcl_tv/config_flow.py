"""Config flow: add a TCL TV by IP; the TV must be on while it is added."""
from __future__ import annotations

from typing import Any
import uuid

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_HOST

from .const import CLIENT_NAME, CONF_ACTIVE_MAC, CONF_CLIENT_ID, CONF_MAC, CONF_MODEL, DOMAIN
from .protocol import TclTvClient, TclTvError, async_probe


class TclTvConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            client_id = uuid.uuid4().hex[:16]
            client = TclTvClient(host, CLIENT_NAME, client_id)
            try:
                identity = await async_probe(host)
                info = await client.connect()
            except TclTvError:
                errors["base"] = "cannot_connect"
            else:
                await self.async_set_unique_id(info.mac)
                self._abort_if_unique_id_configured(updates={CONF_HOST: host})
                return self.async_create_entry(
                    title=identity.name,
                    data={
                        CONF_HOST: host,
                        CONF_MAC: info.mac,
                        CONF_ACTIVE_MAC: identity.active_mac,
                        CONF_MODEL: info.model,
                        CONF_CLIENT_ID: client_id,
                    },
                )
            finally:
                await client.close()
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_HOST): str}),
            errors=errors,
        )
