# TCL TV LAN Remote for Home Assistant

Control TCL TVs that implement the TCL+/T-Cast ("tnscreen") local remote protocol. The integration creates a `media_player` and a `remote`, and bundles an optional iPod click-wheel Lovelace card.

> The protocol has no pairing and uses a fixed key embedded in the official phone app. Only install on a trusted LAN; do not expose TV control ports or Home Assistant to the public internet.

## Compatibility

The integration has been verified against a **TCL 75Q9M Pro, China firmware, protocol 14**. Other TCL models/firmware may use a different LAN control protocol. It requires UDP 6537 for discovery and TCP 6553 for control. The TV must be on and reachable during setup. You can add a static IP manually; auto-discovery is not required.

## Install

### HACS custom repository

1. HACS → Integrations → ⋮ → **Custom repositories**.
2. Add `DusKing1/ha-tcl-tv`, category **Integration**.
3. Install **TCL TV LAN Remote** and restart Home Assistant.
4. Settings → Devices & services → Add integration → **TCL TV LAN Remote**. Enter the TV's IP address.

### Manual

Copy the `custom_components/tcl_tv` directory into `<config>/custom_components/tcl_tv`, restart Home Assistant, then add the integration and enter the TV IP.

## Entities

- `media_player.<tv>` — control-link availability as approximate power state, volume read/set/step, and launching installed apps with `media_player.select_source`.
- `remote.<tv>` — `remote.send_command` accepts lowercase TCL key names from `protocol.py` (`up`, `down`, `left`, `right`, `ok`, `back`, `home`, `menu`, `volume_up`, `volume_down`, `mute`, `source`, digits, and more).

The control link is polled and kept alive; the TV goes offline when it is in standby. The protocol's POWER command is a **toggle**, not an idempotent off operation. The integration sends it only while connected. Wake-on-LAN is implemented from the app's observed packet format but has not been verified on all models or Wi-Fi standby configurations.

Known model-specific limitations: mute readback and input-source listing did not work on the verified TV. The integration does not claim current foreground app or exact screen state.

## iPod click-wheel card

The integration serves `tcl-ipod-card.js` and loads it as a Lovelace module. Add a card to a dashboard:

```yaml
type: custom:tcl-ipod-card
media_player: media_player.your_tcl_tv
remote: remote.your_tcl_tv
```

The wheel supports touch rotation, scroll wheel, keyboard arrows/Enter, center selection, menu navigation, app selection, volume adjustment, and standard remote buttons. The enclosed small screen is a UI metaphor; it is not a live screenshot or playback-status feed from the TV.

## Protocol notes

See [`docs/protocol.md`](docs/protocol.md) for the reverse-engineered message framing, handshake, encryption, command catalogue, and explicit unknowns. Protocol documentation describes phone-app behavior; each feature still needs testing against a target TV firmware.

## Development / deployment

This is a dependency-free HA integration except for the standard `cryptography` package already provided by Home Assistant Core. `protocol.py` itself imports only `cryptography` and Python standard library, so it can be tested separately. After modifying integration code, restart HA Core; reloading a config entry does not clear Python module imports.

Run local checks:

```bash
python -m compileall custom_components/tcl_tv
node --check custom_components/tcl_tv/static/tcl-ipod-card.js
```

## License

MIT. See `LICENSE`.
