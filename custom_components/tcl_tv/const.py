"""Constants for the TCL TV LAN remote integration."""
from homeassistant.const import Platform

DOMAIN = "tcl_tv"
PLATFORMS = [Platform.MEDIA_PLAYER, Platform.REMOTE]

CONF_CLIENT_ID = "client_id"
CONF_MAC = "mac"
CONF_ACTIVE_MAC = "active_mac"
CONF_MODEL = "model"

# Name the TV shows for this controller.
CLIENT_NAME = "HomeAssistant"

RECONNECT_INTERVAL = 5.0  # seconds between connect attempts while the TV is away
VOLUME_POLL_INTERVAL = 10.0  # the TV pushes nothing when volume changes
