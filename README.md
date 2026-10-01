# TCL 电视局域网遥控 · Home Assistant

面向使用 TCL+/T-Cast（`tnscreen`）局域网协议的**中国区 TCL 电视**。集成提供 `media_player`、`remote` 两个实体，并附带 **TCL Glass Remote** 仪表盘卡片。无云端账号依赖；不是通用 TCL / Roku / Google TV 遥控器。

## 兼容性与验证边界

- **最低 Home Assistant Core：2026.9**，这是实际测试版本；更早版本未验证。
- 实机：**TCL 75Q9M Pro，中国区固件，UDP 协议版本 14**。其他型号、地区和固件是否兼容，取决于是否开放同一协议。
- 已实机验证：握手、心跳、音量读取/设置/加减、已安装应用列表。
- 已实现但**未实机验证效果**：应用启动、除音量加减之外的遥控键、Wake-on-LAN（WOL）。协议支持并不等于该电视支持。
- 此实机的静音读回、输入源列表未得到可用结果。集成不知道当前前台应用，也不提供可靠的屏幕开关、播放内容或播放进度读回。

电视首次配置时须已开机、局域网控制服务可达。控制使用 TCP `6553`，发现使用 UDP `6537`；可直接填电视 IP，不依赖自动发现。建议在路由器中固定电视地址。

> 仅用于可信局域网。协议使用手机应用内的固定 AES 密钥，不能将其视为身份认证；不要向公网转发电视控制端口。不要把未经安全配置的 Home Assistant 暴露到公网。

## 安装

### HACS 自定义仓库

1. 打开 HACS → 右上角菜单 → **自定义仓库 / Custom repositories**。
2. 添加 `https://github.com/DusKing1/ha-tcl-tv`，类别选择 **Integration（集成）**，不是 Dashboard。
3. 下载 **TCL TV LAN Remote**，然后重启 Home Assistant。
4. 设置 → 设备与服务 → 添加集成 → **TCL TV LAN Remote**，填写电视 IP。

这是自定义仓库安装方式，不表示项目已进入 HACS 默认仓库列表。

### 手动安装

把仓库中的整个 `custom_components/tcl_tv/` 目录复制到 Home Assistant 配置目录下的 `custom_components/tcl_tv/`，最终应有 `<config>/custom_components/tcl_tv/manifest.json`。重启 Home Assistant，再按上述第 4 步添加集成。

## 实体与控制

- `media_player.<电视实体>`：音量读取、设置、加减；`media_player.select_source` 选择**已安装应用并请求启动**，不是 HDMI 输入源选择，也不是当前前台应用读回。
- `remote.<遥控实体>`：通过 `remote.send_command` 发送 `up`、`down`、`left`、`right`、`ok`、`back`、`home`、`menu`、`volume_up`、`volume_down`、`mute`、`source`、数字等命令。

例如（实体 ID 请替换为自己在 HA 中的实际值）：

```yaml
action: remote.send_command
target:
  entity_id: remote.your_tcl_tv
data:
  command: back
```

**离线表示控制链路不可达，不证明关机、待机或熄屏。** 电源键是切换键，不是幂等的“关机”指令；集成仅在连接可用时发送。开机尝试使用 WOL，目标电视、网络适配器与待机设置是否支持均未验证，请勿据此设计可靠的电源自动化。

## TCL Glass Remote 卡片

集成通过 Home Assistant 前端额外 JavaScript 自动加载卡片，**通常不需要手动添加 Lovelace 资源**。安装并重启后，向仪表盘添加手动卡片：

```yaml
type: custom:tcl-ipod-card
media_player: media_player.your_tcl_tv
remote: remote.your_tcl_tv
```

为兼容已有配置，卡片类型仍叫 `custom:tcl-ipod-card`；公开名称为 **TCL Glass Remote**，不是 iPod 外观复刻。

卡片整体采用 Liquid Glass 质感：全玻璃面板、圆形方向键布局、磨砂应用图块，并提供三个分段页面：

| 页面 / 按钮 | 行为 |
|---|---|
| 遥控 | 圆形方向键发送电视方向键；中心键发送 OK |
| 应用 | 磨砂应用图块网格；方向键移动本地选中项，中心键请求启动选中应用 |
| 音量 | 滑条直接设置音量；圆形控制区用于音量调节 |
| 底部遥控图标（原 MENU） | **只返回卡片本地的遥控页**，不向电视发送菜单键 |
| 底部返回图标 | 向电视发送返回键；遥控页里另有电视菜单按钮 |

应用选中标记只是卡片本地焦点，**不表示电视当前正在运行该应用**。点击启动是一个操作请求，不是成功启动或前台状态确认。卡片不提供播放状态页，玻璃面板不是电视截图。

## 协议研究与支持范围

完整参考：[局域网协议说明](docs/protocol.md)，包括帧格式、精确 AES 参数、发现与握手字段、55 位能力字符串、全部已发现消息、按键、应用记录、WOL 和明确未知项。

文档区分手机应用静态行为、既有离线验证与上述实机结果。它公开研究所得协议事实，不附带 APK、原生库或反编译源码。投屏、语音、应用安装/卸载、账号、清理、AV 协商等协议目录条目**不表示本 HA 集成实现或验证了这些功能**。不支持其他协议电视的自动适配，也不承诺前台应用、屏幕状态、任意浏览器 URL 打开或精确 HDMI 切换。

## 更新记录

### 0.3.0

- 全新 TCL Glass Remote：整体 Liquid Glass 面板、圆形方向键、磨砂应用图块，提供遥控/应用/音量三页与音量滑条。
- 按页面区分圆形控制区操作；底部遥控图标仅进行本地导航，返回图标独立发送电视返回键。
- 不模拟电视播放状态，明确应用选择与前台状态的区别；保留既有卡片类型名以兼容配置。
- 公开完整已研究协议目录与不确定性，补充中国区电视安装和验证边界。

### 初始实现

- 加入 TCL 局域网发现、TCP 握手、AES 控制与心跳。
- 提供 `media_player` / `remote` 实体、音量控制、应用列表与启动请求。
- 附带自动加载的遥控卡片，提供 HACS 自定义仓库及手动安装方式。

## 许可与致谢

本项目代码与原创文档采用 [MIT License](LICENSE)，按现状提供，不保证所有电视兼容。

感谢 MIT 项目 [jarvis2f/tcl-remote](https://github.com/jarvis2f/tcl-remote) 提供的局域网协议与遥控实现参考。扩展协议事实来自 **T-Cast / MagiConnect 10.2.0000**（`com.tnscreen.main`）静态研究；详见协议文档的证据范围和逐项类/方法引用。TCL、T-Cast 等名称属于相应权利人；本项目非官方，与 TCL 或 Home Assistant 官方无隶属关系。MIT 许可不覆盖第三方 APK、源码或商标。
