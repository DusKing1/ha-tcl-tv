# TCL+/T-Cast local remote protocol notes

Reverse-engineered from T-Cast / MagiConnect Android package `com.tnscreen.main` 10.2.0000, then partially exercised on a TCL 75Q9M Pro China TV running protocol version 14. The catalog is phone-app behavior, not a guarantee that every TV firmware implements every message. Do not confuse the TV's online-control link with the active screen or foreground app.

## Transport and handshake

- UDP 6537 discovery. A phone-style probe is `1:<epoch-ms>:<name>:PHONE:1:<name>:<client-id>:0:0\0`; a TV can reply with protocol version, name, and MACs. Discovery only identifies a reachable service; no response is not definitive proof of power-off.
- TCP 6553, persistent full-duplex connection. Each body has a 4-byte big-endian byte-length prefix. Text fields are separated by `>>`.
- First send plaintext `159>><client-name>>1>><client-id>>1`. If response field index 6 is `1`, later frames use AES-128-CBC with PKCS#7 padding, key `tnscreentnscreen`, IV `1234567890abcdef` repeated twice. The initial handshake itself is plaintext.
- `253>>1>>0` is a media-progress push, not a power-state message.
- The phone SDK sends `150>>` after roughly five seconds idle and treats 20 seconds without inbound traffic as a failed link. A different target firmware may choose other timeouts.

The protocol has **no pairing or authentication** in the examined SDK path and ships a fixed AES key. This is obfuscation, not a security boundary. Keep TV and HA control endpoints on a trusted LAN.

## Commands established in the phone SDK

| Feature | Plaintext body after handshake | Response / note |
|---|---|---|
| Press a key | `149>><key-code>` | `20` is POWER and toggles state, not discrete on/off |
| Keepalive | `150>>` | TV responds `150>>YES` on the tested TV |
| Read volume | `136>>` | TV responds `130>><integer>` |
| Set volume | `130>><integer>` | SDK does not establish range |
| Read mute | `140>>` | Expected `131>>true/false`; observed broken on tested TV |
| Set mute | `131>>true` / `131>>false` | Exact SDK serializer; target firmware support must be tested |
| List installed apps | `223>>GET` | Response records are `package::name::icon[::versionCode::versionName::...::systemFlag]`, records separated by `>` |
| Open app | `223>>OPEN>><package-name>` | Serializer established; not validated on every firmware |
| Current cast URL | `257>>1` | Not foreground app; response relates to casting |
| Query/select recent input | `269>>1` / `269>>2>><TV-defined-selector>` | Selector schema opaque; no proven HDMI1/2 IDs |
| Text / keyboard | `155>><text>` / `249` | Keyboard event details vary |
| TV screenshot | `225>>` | Phone SDK expects a URL; HTTP endpoint may not be reachable |
| Wake on LAN | UDP broadcast to port 7778; payload `FF`×6 + target MAC repeated 16 times; 5 transmissions 1 second apart | Present in SDK, but TV MAC selection and standby wake support vary |

Core key codes used by the integration: digits `1..9` = 1..9, `0` = 10, up/down/left/right = 11–14, OK = 15, back = 16, menu = 18, home = 19, power = 20, volume up/down = 21/22, mute = 23, channel up/down = 27/28, source = 29, mouse clicks = 39/40, enter = 68. **OK15 and ENTER68 are different codes.**

## Tested vs unknown

Verified on the cited Q9M Pro: UDP discovery, TCP handshake/encryption, keepalive, volume read/set, key-based volume up/down, app inventory, and TV-off detection by loss of the persistent link. `140>>` returned false despite mute key presses; `242>>` and `269>>1` did not answer; screenshot HTTP URL was refused. App launch and wake-on-LAN remain target-specific and must be separately tested. Full handshake field interpretation, all message IDs, capabilities, and command serializers are maintained in the private research workspace; only the claims needed by this integration are published here.
