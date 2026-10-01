# TCL tnscreen 局域网协议参考

[返回项目说明](../README.md)

## 导航

- [证据范围与引用](#证据范围与引用)
- [传输与加密](#传输与加密)
- [UDP 发现](#udp-发现)
- [V6 握手](#v6-握手)
- [心跳与异步消息](#心跳与异步消息)
- [发现能力字符串：全部 55 个位置](#发现能力字符串全部-55-个位置)
- [全部已发现消息：95 个 ID](#全部已发现消息95-个-id)
- [按键完整映射](#按键完整映射)
- [应用记录与查询](#应用记录与查询)
- [输入源与 Intent](#输入源与-intent)
- [媒体、语音与扩展载荷](#媒体语音与扩展载荷)
- [电源、WOL 与授权边界](#电源wol-与授权边界)
- [Q9M Pro 实机范围与未知项](#q9m-pro-实机范围与未知项)

## 证据范围与引用

研究对象是 **T-Cast / MagiConnect 10.2.0000**，Android 包名 `com.tnscreen.main`，versionCode `1020000`（`com.tnscreen.main.BuildConfig`）。发行入口：[APKPure 应用版本页](https://apkpure.com/t-cast-android-roku-tv-remote/com.tnscreen.main/download)。所研究普通 APK 的 SHA-256：`c7634a69250a4b6f16bdc46faf751bf32a0e6c795d41655e1acde7b4e0bdcddf`；该摘要用于区分样本，不表示未来下载仍是相同版本。

本文公开**协议事实、数据布局和证据定位**，不分发 APK、原生库或反编译源码。引用是该版本 APK 内的完整类/方法名称，可供独立核查，不是本仓库的源码链接。原生加密常量也经过独立静态分析；既有离线 Java/Python 验证见下方测试向量。静态研究过程未向电视发送数据；本文例子均为通用占位/合成载荷，不是家庭设备抓包。

- **静态确定**：手机端实际序列化、解析和能力判定，不等于目标电视一定执行。
- **实机验证**：仅限末节列出的中国区 75Q9M Pro 观察结果。
- **未知 / `[INFERENCE]`**：手机 APK 无法确定的语义，或推论；不等于保留、禁用或不支持。
- 这是**此手机 APK 中发现的完整 95-ID 目录**，不是所有 TCL 固件的服务器协议全集。中国区 TCL+ 或更新版 SDK 可能不同；目录也不等于 HA 集成的功能列表。

引用缩写：

| 缩写 | 完整前缀 |
|---|---|
| `SDK` | `com.tcl.tcastsdk.mediacontroller` |
| `DEV` | `com.tcl.tcastsdk.mediacontroller.device` |
| `CMD` | `com.tcl.tcastsdk.mediacontroller.device.cmd` |

例如 `CMD.SetVolumeCmd.pack` 即 `com.tcl.tcastsdk.mediacontroller.device.cmd.SetVolumeCmd.pack`；`SDK.bean.TVAppsInfo.parseInfo` 同理。感谢 [jarvis2f/tcl-remote](https://github.com/jarvis2f/tcl-remote)（MIT）提供的基础协议实现参考；其 `enter=15` 是 OK 别名，不是 SDK 的 ENTER=68。本文不是 TCL 官方协议规范。

## 传输与加密

### TCP 帧

发现使用 UDP **6537**，控制使用持久双向 TCP **6553**（`DEV.IpMessageConst.PORT/PORT_COMMAND`、`DEV.TCLDevice.connect`）。

```text
[4 字节大端 payload 字节数][恰好该长度的 payload]
```

长度是**传输体长度**：加密时计算密文长度，而不是明文字符数。明文编码 UTF-8，以字面量 `>>` 分字段，无结尾 NUL/CRLF，也无 JSON-RPC 请求 ID 包装。证据：`DEV.tcp.AbstractPacketWriter.writeMyUTF`、`DEV.tcp.PacketReader.readNextPacket`。

- 手机读端拒绝长度 `>= 1,048,576`；启用 TCP_NODELAY 与 SO_KEEPALIVE（`DEV.tcp.TCLSocket.ConnectThread.run`）。
- `136>>`、`150>>`、`225>>` 的尾分隔符是实际发送内容；键盘请求是 **`249`**，无分隔符。
- Java `split` 丢弃末尾空字段，但保留中间空字段。不同消息的内层分隔符不同，不能统一展平。
- 电视可异步推送，不能将“下一帧”等同于上个请求的回复。`[INFERENCE]` 自写客户端应缓冲 TCP 半帧、按 ID 分派、保留中间空字段并串行写帧；JSON CommonProxy 会把 ID 后各片段用 `>>` 重新拼接，而位置式解析器各自拆分。

### AES 参数

初始 **159 请求始终明文**。读端协商前算法值为 `-2`，不解密；159 回复字段 **6** 选择算法。算法 `1` 时，后续 TCP 体使用 **AES-128-CBC + PKCS5Padding**（对 AES 的 16 字节块等同 PKCS7），传输**原始密文**，不是 Base64。该手机实现对其他算法值使用明文。

| 参数 | 精确值 |
|---|---|
| Key | ASCII `tnscreentnscreen`，16 字节 |
| IV | **字节** `12 34 56 78 90 AB CD EF 12 34 56 78 90 AB CD EF` |
| Transformation | `AES/CBC/PKCS5Padding` |
| 每帧状态 | 每次新建/初始化 Cipher，固定相同 IV；无跨帧 IV 链接 |

IV 不是字符串 `"1234567890abcdef1234567890abcdef"` 的 ASCII 编码，也不是全零。证据：`DEV.TCLDevice.sendCommand`、`DEV.tcp.AlgorithmPacketWrite`、`DEV.tcp.PacketReader.ReceiveDataThread.readMyUTF`、`com.tcl.tcastsdk.util.SecurityUtil.AES.encrypt/decrypt`、`ConstantUtil.getTransformation1`、`NativeUtil.getKey/getIV`。

原生 arm64 `libjnitool.so` 的 `.rodata` VA `0x538` 存放上述 16 字节 IV，VA `0x548` 存放以 NUL 结束的密钥；JNI `Java_com_tcl_tcastsdk_util_NativeUtil_getKey`（`0x77c`）与 `...getIV`（`0x6e8`）分别返回它们。这是样本内偏移，不是 TV 内存地址。

既有离线 Java 与 Python 结果相同：

```text
明文：149>>20
密文 hex：473d4f5e84ac1eb069f46e58e372f0d6
整帧 hex：00000010473d4f5e84ac1eb069f46e58e372f0d6
```

此向量证明帧/加密兼容性，**不证明电视执行了电源键**。

## UDP 发现

`SDK.discover.IpMessageProtocol.getProtocolString` 的格式：

```text
version:packetNo:senderName:senderType:commandNo:additionalSection
```

`packetNo` 是 epoch **毫秒**（虽然 helper 名为 `getSeconds`）；UTF-8。手机上线通知（`SDK.discover.TCLDeviceScanner.NoticeOnlineThread.run`）：

```text
1:<timestamp_ms>:<clientName>:PHONE:1:<clientName>:<discoveryClientId>:0:0\0
```

这里 `\0` 表示末尾 **NUL 字节**，不是反斜线与数字 0。默认名字取手机 `Build.MODEL`；发现标识 `selfImei` 与握手 Android-ID UUID 是分别配置的值（`SDK.Config`、`SDK.TCLDeviceManager.newConfig`），不应混为设备密钥。

电视响应按整包 `:` 字段编号：

| 字段 | 手机端用途 |
|---:|---|
| 0 | UDP 协议版本；`<6` 选择 TCP V5，`>=6` 选择 V6 |
| 1 | packetNo / 时间戳 |
| 2 | 电视 senderName，保存为设备名 |
| 3 | senderType，须为 `TV` |
| 4 | **commandNo**，不是屏幕/电源状态 |
| 5 | additionalSection[0]，扫描器忽略；常见为重复显示名称 |
| 6 | additionalSection[1]，能力字符串 `functionCode` |
| 7 | additionalSection[2]，扫描器忽略；语义未知 |
| 8 | additionalSection[3]，`mac` |
| 9 | additionalSection[4]，`p2pMac`，未证明是蓝牙地址 |
| 10 | additionalSection[5]，`activeMac`，未证明是蓝牙地址 |

MAC 中 `&#058` 被替换为冒号，解码不要求分号；不要将这三个字段擅自命名为 Wi-Fi / 蓝牙地址。证据：`SDK.discover.TCLDeviceScanner.deviceOnline`、`SDK.discover.IpMessageProtocol`。

| UDP commandNo | SDK 常量语义 / 扫描器行为 |
|---:|---|
| 1 | entry；手机回复 command 3 并刷新在线 |
| 2 | exit；移除已知但未连接的设备 |
| 3 | answer-entry；刷新在线 |
| 4 | unicast-entry；与 3 使用相同在线刷新路径 |

旧应用常量曾把 4 命名为 `BR_ABSENCE`，与 SDK 命名不一致；**3/4 都不能证明待机或亮屏**，服务端区分原因未知。扫描器默认每 6 秒通告（最小 1 秒），30 秒没收到通知则移除（`checkOffline`）。发现缺失只说明不可达。

## V6 握手

手机连接后发送：

```text
159>><clientName>>1>><clientId>>1
```

| 请求字段（ID 为 0） | 含义 |
|---:|---|
| 0 | 159 / GET_CLIENTTYPE |
| 1 | `Config.selfName` |
| 2 | 字段名 `secret`，此路径固定字面量 `1`，无密码推导 |
| 3 | `Config.uuid`，手机由 `Settings.Secure.android_id` 初始化；第三方示例使用自己的稳定占位 ID |
| 4 | 固定字面量 `1`；精确目的未知，**未证明是协议版本** |

证据：`DEV.protocol.ProtocolHandlerV6.handleSocketConnectedEvent`、`CMD.InquiryDeviceInfoCommand.pack`。

159 电视回复位置来自 `DEV.protocol.ProtocolHandlerV6.parseGetClientTypeCmd`，同样从 ID=0 计数：

| 字段 | Setter / 含义 |
|---:|---|
| 0 | 159 |
| 1 | `setClientType`：型号/客户端类型 |
| 2 | 以 `:` 分成 `setAppVersionCode`、`setAppVersionName`：TV 端应用/服务版本 |
| 3 | `setSoftwareVersion`：平台固件版本 |
| 4 | `setTvDeviceNum`：TV 设备编号 |
| 5 | `setMac` |
| **6** | **`setAlgorithmType`：1=AES** |
| 7 | `setBluetoothMac`：转为大写；允许为空 |
| 8 | `setTVType`：1=ANDROID，2=LINUX（`SDK.AppManagerProxy.TVOSTYPE`） |
| 9 | `setTVStore`：1=ZEASN、2=FOXEN、3=HUANGNET、4=FFALCON；其他值此 APK 未识别 |
| 10 | `setShakeFunctionCode`：十进制数字位掩码，**不是发现的字符能力串** |
| 11 | `setTvLanguage` |
| 12 | `setSnCode`：序列号 |
| 13 | `setClientCode` |
| 14 | `setCountryCode` |
| 15 | `setP2pMac` |
| 16 | `setActiveMac` |
| 17 | `setTvDeviceId` |
| 18 | `setTvNetIP`：按字符串保存，此处不解析其结构 |

中间空字段仍占一个索引；不要跳过后再数。**协议版本 14 来源于 UDP 字段 0**，不是159 的2、4或8。手机看到159 后设置 `hasHandShake` 并回调连接成功；此路径未显示 challenge-response 或每客户端令牌校验。

字段10 的已知数字位掩码（`DEV.TCLDevice.isSupport*`）：

| 十进制掩码 | Predicate / 含义 |
|---:|---|
| 1 | `isSupportCrawlerVideo` |
| 2 | `isSupportUserInfo` |
| 4 | `isSupportVideoHistory` |
| 8、16 | 未知 |
| 32 | `isSupportTVGuard` |
| 64 | `isSupportLingXi` |
| 128 | `isSupportSmartSpeaker` |
| 256 | `isSupportAutoConnectBluetooth` |
| 512 | `isSupportRequestConnectInfo`，还要求 UDP 协议 >=14 |

未找到可证明的 WOL gate。**不要用这份掩码解释 UDP 能力串，也不要把能力宣告当成实机执行证明。**

## 心跳与异步消息

`DEV.heartbeat.HeartbeatRequest` 发送 `150>>`；算法1时照常 AES 加密。写队列轮询空闲 **5000 ms** 后启动心跳，超时 **20000 ms** 后以 code `2002` / reason `beatTimeout` 断开（`DEV.TCLDevice.heartbeat`）。**任何非空接收帧**都会完成所有等待的心跳，不只150（`DEV.tcp.PacketReader.responseAllHeartBeat`）。150 在应用 proxy 监听器前被过滤，回复 ID 后内容未解释。

这只是手机端时间设置：服务器空闲断开阈值未知；读队列的5秒空闲回调没有设备动作，也未设置 TCP SO_TIMEOUT。

连接初始阶段观察到的 `253>>1>>0` 是**外部/Orange/第三方视频进度**：媒体 ID/vid=`1`、position=`0`，**不是电源或屏幕状态**。`SDK.OrangeVideoPlayerProxy.parserMsgAndNotifyIfNeed` / `isOurVideo` 仅在字段1匹配本次投屏媒体时更新播放位置和状态；无投屏上下文时忽略。单位和 TV 初始发送原因未知。协商切换后的正常接收体按 AES 解码；若固件随后仍推明文，手机 Java 读端会尝试解密，混合明/密文行为必须另行实测，不能由本例推导。

## 发现能力字符串：全部 55 个位置

以下索引均**从0开始**，对应 `charAt`。它是**字符编码串，不是通用 bitset**：位置4可为3，27可为2，42可为2；缺失/短字符串的默认行为因方法不同。表中的1表示与字符 `'1'` 比较，旧路径单独标注。未知表示此 APK 未找到映射，不代表保留。

| Index | Meaning/gate in this APK | Evidence method |
|---:|---|---|
| 0 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 1 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 2 | audio/video control; SDK1 enabled, legacy0 disabled | `DEV.TCLDevice.isSupportAudioAndVideoControl; com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 3 | legacy protocol2 online-video support only7; protocol>2 enables regardless | `DEV.TCLDevice.isSupportOLVideo` |
| 4 | voice0/2 disabled;3 selects recognized-text mode | `SDK.voice.VoiceControlProxy.isSupportVoiceControl; com.tcl.tcast.remotecontrol.VoiceControlByString.supportVoiceByString` |
| 5 | TV-back legacy1 | `com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 6 | screenshot1; legacy missing defaults enabled | `DEV.TCLDevice.isSupportScreenshot; com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 7 | image save1; null string fallback nonempty tvVersionInfo | `DEV.TCLDevice.isSupportImageSave` |
| 8 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 9 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 10 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 11 | legacy personalTV not0; protocol!=1 and length>12 | `com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 12 | legacy small video1 | `com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 13 | legacy Linux online-video code, not boolean | `com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 14 | legacy call notification1 | `com.tcl.tcast.middleware.tcast.utils.SearchDeviceService.runFunctionInfo` |
| 15 | new Linux TV1 | `DEV.TCLDevice.isNewLinuxTV` |
| 16 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 17 | audio playlist; protocol>3 and missing/short or1 | `DEV.TCLDevice.isSupportAudioList` |
| 18 | live video1; short string fallback appVersionCode>=20170417 | `DEV.TCLDevice.isSupportLiveVideo` |
| 19 | document cast1 | `DEV.TCLDevice.isSupportDoc` |
| 20 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 21 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 22 | T-Channel1 | `DEV.TCLDevice.isSupportTChannel` |
| 23 | selected1 (semantic only method name) | `DEV.TCLDevice.isSupportSelected` |
| 24 | Twitch1 | `SDK.bean.TCLDeviceInfo.isSupportTwitch` |
| 25 | performance/preload1 | `DEV.TCLDevice.isSupportPerf` |
| 26 | M3U8-resource1 | `SDK.bean.TCLDeviceInfo.isSupportM3u8Resource` |
| 27 | Miracast1; app special mode2 | `DEV.TCLDevice.isSupportMiracast; com.tcl.tcast.tools.view.MirrorActivity` |
| 28 | commonApp returns true for0, inverse | `SDK.bean.TCLDeviceInfo.isCommonApp` |
| 29 | virtual game1 | `SDK.bean.TCLDeviceInfo.isSupportVirtualGame` |
| 30 | Miracast callback1 | `DEV.TCLDevice.isSupportMiracastCallback` |
| 31 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 32 | MeTV1 | `DEV.TCLDevice.isSupportMeTV` |
| 33 | children education1 | `DEV.TCLDevice.isSupportChildrenEdu` |
| 34 | input-helper1 | `DEV.TCLDevice.isSupportInputHelper` |
| 35 | VOD1 | `DEV.TCLDevice.isSupportVod` |
| 36 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 37 | Google launcher1 | `SDK.bean.TCLDeviceInfo.isTVSupportGoogleLauncher` |
| 38 | Baidu Netdisk1 | `DEV.TCLDevice.isSupportBaiduNetDisk` |
| 39 | App Diver1 | `DEV.TCLDevice.isSupportAppDiver` |
| 40 | enhanced intents1 | `DEV.TCLDevice.isSupportEnhanceIntent` |
| 41 | recent-apps1 | `DEV.TCLDevice.isSupportRecentApp` |
| 42 | 2 selects VOD playlist link; otherwise source code19 | `com.tcl.tcast.onlinevideo.presentation.presenter.presenterhelper.controller.DisplayHelperImpl` |
| 43 | overseas TVGuard1 | `DEV.TCLDevice.isOverseasSupportTVGuard` |
| 44 | screen extension1, **not screen-off power** | `DEV.TCLDevice.isSupportScreenEx` |
| 45 | AV1 | `DEV.TCLDevice.isSupportAv` |
| 46 | local APK install1 | `DEV.TCLDevice.isSupportLocalApkInstall` |
| 47 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 48 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 49 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 50 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 51 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 52 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |
| 53 | T-Channel launcher1 | `SDK.bean.TCLDeviceInfo.isSupportTChannelLauncher` |
| 54 | unknown, no mapping found | `[INFERENCE: not interpretable from this APK]` |

## 全部已发现消息：95 个 ID

所有形式都是**解码后的明文体**，需按上文包帧；159 初始请求为明文，其余 TCP 命令（包括心跳）在算法1时加密。UDP 发现与 WOL 不使用此 AES。`C→T`=手机/客户端→TV，`T→C`=TV→手机，`both`=双方，`unknown`=未知。`<...>` 是占位符，方括号是可选项，都不是线上字面量。示例 URL 的 `host`/`tv` 是虚构占位主机。

仅常量的行没有可执行序列化/解析证据，**不得凭名称补造请求**；接收 parser 也不能证明消息必为主动推送或特定请求的回复。同一 ID 的多种用途取决于 capability/context。ID 间空缺未发现定义，不为其臆造目录行。

| ID | Direction | Exact format / layout | Example | When/meaning | Evidence |
|---:|---|---|---|---|---|
| 129 | C→T | `129>>` | `129>>` | stop cast player | `CMD.StopCmd.pack; SDK.TCLVideoPlayerProxy.stop` |
| 130 | both | `130>><integerVolume>` | `130>>25` | set volume; inbound volume state | `CMD.SetVolumeCmd.pack; SDK.TCLRenderProxy.setVolume/parserMsgAndNotifyIfNeed` |
| 131 | both | `131>><true/false>` | `131>>true` | set/read mute state | `CMD.SetMuteCmd.pack; SDK.TCLRenderProxy.setMute/parserMsgAndNotifyIfNeed` |
| 132 | C→T | `132>><position>` | `132>>60000` | seek cast player; native video/audio units ms (position polling adds milliseconds) | `CMD.SeekToCmd.pack; SDK.TCLVideoPlayerProxy.seekTo/InquiryCurrentPositionThread.run` |
| 133 | C→T | `133>><Video/Audio/Image/m3u8/share>[>>imageAngle]` | `133>>Video` | prepare selected cast player | `CMD.PreparePlayCmd.pack; CMD.ImagePreparePlayCmd.pack` |
| 134 | C→T | `134>><mediaInfo> or 134>> to resume` | `134>>http://host/v.mp4->Title->null->null->null->false->1920->1080` | URL playback/resume; see mediaInfo below | `CMD.PlaySingleCmd.pack; SDK.bean.VideoInfo.getInfo; SDK.TCLAudioPlayerProxy.play` |
| 135 | C→T | `135>>` | `135>>` | pause cast player | `CMD.PauseCmd.pack` |
| 136 | C→T | `136>>` | `136>>` | query volume (reply130) | `CMD.InquiryVolumeCmd.pack` |
| 137 | unknown | `unknown; constant only` | `no supported example` | Named MEDIA_GET_SUPPORTED_MEDIA_TYPE, no executable serializer/parser found | `DEV.IpMessageConst.MEDIA_GET_SUPPORTED_MEDIA_TYPE` |
| 138 | C→T | `138>>` | `138>>` | query player status (reply144) | `CMD.InquiryPlayStatusCmd.pack` |
| 139 | C→T | `139>>` | `139>>` | query play state (reply145) | `CMD.InquiryPlayStateCmd.pack` |
| 140 | C→T | `140>>` | `140>>` | query mute (reply131) | `CMD.InquiryMuteCmd.pack` |
| 141 | C→T | `141>>` | `141>>` | query duration (reply146) | `CMD.InquiryDurationCmd.pack` |
| 142 | C→T | `142>>` | `142>>` | query position (reply147) | `CMD.InquiryCurrentPositionCmd.pack` |
| 143 | unknown | `unknown; constant only` | `no supported example` | Named MEDIA_GET_CURRENT_TRANSPORT_ACTIONS, no executable serializer/parser found | `DEV.IpMessageConst.MEDIA_GET_CURRENT_TRANSPORT_ACTIONS` |
| 144 | T→C | `144>><OK/PLAYER_EXIT/ERROR_OCCURRED>[>>mediaType>>url]` | `144>>OK` | player status | `SDK.TCLVideoPlayerProxy.parserMsgAndNotifyIfNeed; SDK.TCLAudioPlayerProxy.parserMsgAndNotifyIfNeed` |
| 145 | T→C | `145>><STOPPED/PLAYING/TRANSITIONING/PAUSED_PLAYBACK>[>>mediaType>>url]` | `145>>PLAYING>>Video>>http://host/v.mp4` | play state | `SDK.TCLVideoPlayerProxy.parserMsgAndNotifyIfNeed; SDK.TCLAudioPlayerProxy.parserMsgAndNotifyIfNeed` |
| 146 | T→C | `146>><durationInt>` | `146>>120000` | duration ms in native cast player | `SDK.TCLVideoPlayerProxy.parserMsgAndNotifyIfNeed; SDK.TCLAudioPlayerProxy.parserMsgAndNotifyIfNeed` |
| 147 | T→C | `147>><positionInt>` | `147>>60000` | position ms in native cast player | `SDK.TCLVideoPlayerProxy.parserMsgAndNotifyIfNeed; SDK.TCLAudioPlayerProxy.parserMsgAndNotifyIfNeed` |
| 148 | unknown | `unknown; constant only` | `no supported example` | Named MEDIA_SET_CURRENT_TRANSPORT_ACTIONS, no executable serializer/parser found | `DEV.IpMessageConst.MEDIA_SET_CURRENT_TRANSPORT_ACTIONS` |
| 149 | C→T | `149>><keyCode>` | `149>>20` | key press (repeat for long press) | `CMD.RemoteControlKeyCmd.pack; SDK.TCLRemoteControlProxy.sendKeyAction` |
| 150 | both | `C→T 150>>; T→C any 150 tail ignored` | `150>>` | idle heartbeat, see timing section | `DEV.heartbeat.HeartbeatRequest; DEV.tcp.PacketReader.isHeartBeat` |
| 151 | C→T | `151>><xInt>><yInt>` | `151>>-10>>5` | mouse movement; absolute vs relative unresolved | `CMD.RemoteControlMouseCmd.pack; SDK.TCLRemoteControlProxy.sendMouseAction` |
| 155 | C→T | `155>><text>` | `155>>hello` | IME text injection, no escaping visible | `CMD.RemoteControlInputCmd.pack; SDK.TCLRemoteControlProxy.sendInputStr` |
| 156 | unknown | `unknown; constant only` | `no supported example` | Named AIWI_GAME, no executable serializer/parser found | `DEV.IpMessageConst.AIWI_GAME` |
| 157 | C→T | `157>><start/stop>` | `157>>start` | voice recording control; PCM on separate TCP4332 | `CMD.VoiceControlCmd.pack; SDK.voice.VoiceControlProxy.startVoice/destroy` |
| 158 | C→T | `158>>` | `158>>` | save cast image on TV | `CMD.ImageSaveCmd.pack; SDK.TCLImagePlayerProxy.save` |
| 159 | both/plaintext | `see handshake indexes` | `159>>HA>>1>>ha-client>>1` | connection handshake | `CMD.InquiryDeviceInfoCommand.pack; DEV.protocol.ProtocolHandlerV6.parseGetClientTypeCmd` |
| 160 | C→T | `160>><phoneimei>><phonename>` | `160>>ha-client>>HA` | post-connect notification unless silent | `CMD.PromptPhoneConnectedCommand.pack; SDK.TCLDeviceManager.StateIdle.AnonymousClass1.onConnected` |
| 176 | both | `176>>` | `176>>` | previous image/audio | `CMD.PlayPreCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 177 | both | `177>>` | `177>>` | next image/audio | `CMD.PlayNextCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 178 | C→T | `178>>` | `178>>` | no previous image / first boundary | `CMD.ImageListFirstCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 179 | C→T | `179>>` | `179>>` | no next image / end boundary | `CMD.ImageListEndCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 180 | both | `180>><0/1>[>>quarterTurns]` | `180>>1>>2` | image rotate 0 counterclockwise,1 clockwise; inbound first value int | `CMD.ImageRotateCmd.pack; SDK.TCLImagePlayerProxy.rotate/parserMsgAndNotifyIfNeed` |
| 181 | both | `181>><0/1>` | `181>>1` | slideshow off/on | `CMD.ImageSlideCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 182 | both | `182>><modeInt>` | `182>>1` | music play mode; semantics integers not established here | `CMD.SetMusicModeCmd.pack; SDK.TCLAudioPlayerProxy.setMusicMode/parserMsgAndNotifyIfNeed` |
| 183 | unknown | `unknown; constant only` | `no supported example` | Named GET_SYSTEM_VOLUME, no executable serializer/parser found | `DEV.IpMessageConst.GET_SYSTEM_VOLUME` |
| 184 | unknown | `unknown; constant only` | `no supported example` | Named SET_SYSTEM_VOLUME, no executable serializer/parser found | `DEV.IpMessageConst.SET_SYSTEM_VOLUME` |
| 185 | unknown | `unknown; constant only` | `no supported example` | Named SEND_PLYAING_NAME, no executable serializer/parser found | `DEV.IpMessageConst.SEND_PLYAING_NAME` |
| 186 | unknown | `unknown; constant only` | `no supported example` | Named GET_PLAYING_NAME, no executable serializer/parser found | `DEV.IpMessageConst.GET_PLAYING_NAME` |
| 187 | unknown | `unknown; constant only` | `no supported example` | Named PICTURE_PLAYER_EXIT, no executable serializer/parser found | `DEV.IpMessageConst.PICTURE_PLAYER_EXIT` |
| 188 | unknown | `unknown; constant only` | `no supported example` | Named PLAY_SEEKTO, no executable serializer/parser found | `DEV.IpMessageConst.PLAY_SEEKTO` |
| 189 | unknown | `unknown; constant only` | `no supported example` | Named SEND_PHONE_NAME, no executable serializer/parser found | `DEV.IpMessageConst.SEND_PHONE_NAME` |
| 190 | unknown | `unknown; constant only` | `no supported example` | Named MEDIA_PICTURE_ZOOM, no executable serializer/parser found | `DEV.IpMessageConst.MEDIA_PICTURE_ZOOM` |
| 191 | unknown | `unknown; constant only` | `no supported example` | Named PERSONALTV_SHAKE, no executable serializer/parser found | `DEV.IpMessageConst.PERSONALTV_SHAKE` |
| 223 | both | `223>><GET/OPEN/PACKAGEINFO/INSTALL/UNINSTALL/PROGRESS>...` | `223>>GET` | installed app management, full subformats below | `CMD.AppManagerCmd.pack; SDK.AppManagerProxy.AppItem; SDK.AppManagerProxy.parserMsgAndNotifyIfNeed` |
| 224 | both | `224>><url> (document), or 224>><runtype>>playerName>>apkURL>>packageName>>className>>action>>link>>sourceId; m3u8 variant final playerParam without sourceId` | `224>>http://host/file.pdf` | external player/document; T→C WPS variant224>>1>>WPS>>field3>>field4 | `CMD.DocCastCmd/PlayUnknownVideoCmd/PlayM3u8VideoCmd.pack; SDK.TCLOnlineVideoPlayerProxy.parserMsgAndNotifyIfNeed` |
| 225 | both | `query225>>; reply225>>status[>>picURL]` | `225>>` | screenshot; reply0 success,1 fail,2/4 unsupported,3 storage full | `CMD.ShotPicCmd.pack; SDK.TCLShotPicProxy.parserMsgAndNotifyIfNeed` |
| 229 | C→T | `229>><size>><index>><listJSON>` | `229>>1>>0>>{"list":[{"name":"Song","url":"http://host/a.mp3","singer":"Artist","coverPath":"null","album":"Album"}]}` | audio playlist after133>>Audio | `CMD.PlayListCmd.pack; com.tcl.tcastsdk.util.JSONUtils.audioList2JSON` |
| 232 | C→T | `232>><scaleType>><scale>><centerX>><centerY>` | `232>>2>>1.5>>0>>0` | image scale type1 smaller,2 larger | `CMD.ImageZoomCmd.pack` |
| 233 | C→T | `233pcm_text>><control>; app control1 start,2 stop,6>>recognizedText (no >> after233)` | `233pcm_text>>6>>hello` | recognized voice text, unusual literal exact serializer | `CMD.VoiceControlStringCmd.pack; SDK.TCLRemoteControlProxy.sendVoiceRecordString` |
| 234 | C→T | `234>>` | `234>>` | query music mode, reply182 | `CMD.GetMusicModeCmd.pack` |
| 235 | both | `235>><index>` | `235>>0` | select playlist index / inbound current index | `CMD.SetMusicPlayIndexCmd.pack; SDK.TCLAudioPlayerProxy.parserMsgAndNotifyIfNeed` |
| 236 | both | `236>><scaleFloat>><centerX>><centerY>` | `236>>1.5>>0>>0` | image zoom; reply may omit coordinates | `CMD.ImageScaleCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 237 | both | `237>><dx>><dy>` | `237>>10>>-5` | image movement; outbound text coords, inbound floats | `CMD.ImageMoveCmd.pack; SDK.TCLImagePlayerProxy.parserMsgAndNotifyIfNeed` |
| 238 | C→T | `238>><0/1/2>><phoneName>` | `238>>1>>HA` | phone call idle/ringing/offhook | `CMD.PhoneCallStatusCmd.pack; SDK.TCLPhoneCallStateProxy.notifyCallStatus` |
| 239 | both | `query239>>1; reply239>>1>>totalStorage>>availableStorage` | `239>>1` | TV storage size | `CMD.GetTVStorageCmd.pack; SDK.AppManagerProxy.parserMsgAndNotifyIfNeed` |
| 241 | both | `241>><BluetoothMAC>; reply241>>status` | `241>><BluetoothMAC>` | Bluetooth remote pairing (not TCP-controller pairing) | `CMD.PairBluetoothRemoteControlCmd.pack; SDK.TCLRemoteControlProxy.pairBluetoothRemoteControl` |
| 242 | both | `query242>>; reply242>><volumeInt>` | `242>>` | one-shot system volume | `CMD.GetVolumeKeyCmd.pack; SDK.TCLGetVolumeProxy.parserMsgAndNotifyIfNeed` |
| 243 | C→T | `243>><source>><originalUrl>><analysisUrl>><videoName>><JSVersion>` | `243>>1>>http://host/page>>http://host/v.mp4>>Title>>1` | crawler video | `CMD.PlayCrawlerVideoCmd.pack` |
| 245 | both | `query245>>; reply245>><loginFlag>[>>account>>nickname>>iconURL]` | `245>>` | TV account, flag0 logged in | `CMD.GetUserInfoCmd.pack; SDK.TCLUserManagerProxy.parserMsgAndNotifyIfNeed` |
| 246 | both | `query246>>; reply246>><result>[>>historyJSON]` | `246>>` | video history, result0 success | `CMD.GetVideoHistoryCmd.pack; SDK.TCLUserManagerProxy.parserMsgAndNotifyIfNeed` |
| 247 | both | `247>><0 pushToPass/1 deepClean/2 networkTest>; reply247>><int>` | `247>>1` | deep TV cleanup, not standby; inbound1 success | `CMD.TVGuardCmd.pack; SDK.TCLRemoteControlProxy.deepClean; SDK.TCLTVGuardProxy.parserMsgAndNotifyIfNeed` |
| 248 | both | `248>><actionCode>; reply248>>1>>totalSpace>>userSpace` | `248>>1` | space query | `CMD.GetTVSpaceCmd.pack; SDK.TCLTVGuardProxy.reloadTVSpaceInfo/parserMsgAndNotifyIfNeed` |
| 249 | both | `C→T249 (no delimiter); T→C249>><text>` | `249` | keyboard interaction/open request + input text callback | `CMD.KeyboardInputCmd.pack; SDK.TCLRemoteControlProxy.mReceiveMsgListener.onReceiveMsg` |
| 250 | T→C | `250>><ignoredTail>` | `250>>1` | keyboard hidden callback; requires tail in parser | `SDK.TCLRemoteControlProxy.mReceiveMsgListener.onReceiveMsg` |
| 251 | both | `251>>1 query T-Channel;251>><JSON> launch T-Channel;251>><MAC> Bluetooth reconnect;reply251>>1>>params` | `251>>1` | colliding meanings, capability/context-specific | `CMD.GetTChannelInfoCmd/StartTChannelCmd/RequestRemoteBluetoothConnectCmd.pack; SDK.TCLChannelProxy.parserMsgAndNotifyIfNeed` |
| 252 | both | `252>>1 app params;252>><JSON> open/install;252>><MAC> Bluetooth check;reply252>>1>>params or252>>3 app-update` | `252>>1` | colliding meanings, context-specific | `CMD.GetAppParamsCmd/StartOpenOrInstallAppCmd/CheckLocalBluetoothMacCmd.pack; SDK.TCLChannelProxy.parserMsgAndNotifyIfNeed` |
| 253 | T→C | `253>><mediaIdOrVid>><positionInt>` | `253>>1>>0` | external video progress, not power | `SDK.OrangeVideoPlayerProxy.parserMsgAndNotifyIfNeed; SDK.ThirdPartVideoPlayerProxy.parserMsgAndNotifyIfNeed` |
| 254 | both | `C→T254>><packageName>;T→C254>><packageName>><vid> in third-party parser` | `254>>com.example.player` | stop external player; Orange parser treats any254 tail as stopped | `CMD.ThirdVideoStopCmd.pack; SDK.ThirdPartVideoPlayerProxy/OrangeVideoPlayerProxy.parserMsgAndNotifyIfNeed` |
| 255 | both | `255>>1>><phoneId>><appVersion>;reply255>><uninterpreted selector>><connectId>` | `255>>1>>ha-client>>10.2.0000` | connect-info extension (protocol14 and mask512) | `CMD.RequestConnectInfoCmd.pack; SDK.TCLConnectProxy.parserMsgAndNotifyIfNeed` |
| 256 | C→T | `256>><imageURL>` | `256>>http://host/photo.jpg` | image URL preload | `CMD.PreloadPicURLCmd.pack` |
| 257 | both | `query257>>1;reply257>>1>>playURL[>>uuid]` | `257>>1` | current playing URL (not browser openURL) | `CMD.GetPlayURLCmd.pack; SDK.TCLChannelProxy/TCLConnectProxy.parserMsgAndNotifyIfNeed` |
| 258 | C→T | `258>>0` | `258>>0` | wakeup casting service on already connected TV, not standby WOL | `SDK.TCLCommonProxy.wakeupLelinkServer` |
| 259 | T→C | `259>><ignoredTail>` | `259>>1` | phone keyboard open callback | `SDK.TCLRemoteControlProxy.mReceiveMsgListener.onReceiveMsg` |
| 260 | both | `260>><1 query/2 offline>><phoneIP>;reply260>><1/2>><statusInt>` | `260>>1>><phoneIP>` | Miracast status/offline | `CMD.GetMiracastStatusCmd/SetMiracastOfflineCmd.pack; SDK.TCLConnectProxy.parserMsgAndNotifyIfNeed` |
| 261 | C→T | `261>><text>><base64PNG-or-null>` | `261>>hello>>null` | TV notification (icon max1,024,000 chars) | `CMD.SendMessageCmd.pack; SDK.TCLRemoteControlProxy.notificationTCL` |
| 262 | unknown | `unknown; constant only` | `no supported example` | Named CLOUD_GAME, no executable serializer/parser found | `DEV.IpMessageConst.CLOUD_GAME` |
| 263 | C→T | `263>><1 activity/2 broadcast>><intentJSON>` | `263>>1>>{"action":"android.intent.action.MAIN","category":"android.intent.category.LAUNCHER","component":{"pkg":"com.qclive.tv","cls":"com.qclive.tv.MainActivity"}}` | Android intent launch; extras types0 string1 int2 bool | `SDK.TCLCommonProxy.sendIntentParams; com.tcl.tcast.util.MeTVUtil.sendIntentParams` |
| 264 | both | `264>><1 mirrorControl/2 videoCall>><JSON>` | `264>>1>>{"sessionId":1,"timeout":10000,"needConfirm":true}` | AV negotiate | `SDK.TCLAvProxy.launch/handleMsg; SDK.req.AvExchangeRequest/AvGetRequest/AvOptRequest` |
| 265 | both | `265>><1 mirrorControl/2 videoCall>><JSON>` | `265>>1>>{"sessionId":1}` | AV params query | `SDK.TCLAvProxy.getParams/handleMsg; SDK.req.AvExchangeRequest/AvGetRequest/AvOptRequest` |
| 266 | both | `266>><1 mirrorControl/2 videoCall>><JSON>` | `266>>1>>{"sessionId":1,"infoCode":0}` | AV notify | `SDK.TCLAvProxy.phoneNotice/handleMsg; SDK.req.AvExchangeRequest/AvGetRequest/AvOptRequest` |
| 267 | T→C | `267>><opaque inputHelper payload>` | `unknown; no fixed example` | input helper callback; schema opaque | `SDK.TCLCommonProxy.handleMsg` |
| 268 | both | `268>><JSON {commandType,extraMap}>` | `268>>{"commandType":200}` | TV VOD playback controls/query; selectors below | `SDK.TCLVodProxy.sendVodParams/handleMsg; SDK.req.VodRequest` |
| 269 | both | `query269>>1;switch269>>2>><opaqueInfo>;reply269>><uninterpreted field1>><opaqueInfo>` | `269>>1` | recent source/input query and selection; opaque response/selector | `CMD.RecentInputCmd.pack; SDK.TCLRemoteControlProxy.getRecentInputs/switchRecentInput/mReceiveMsgListener.onReceiveMsg` |
| 270 | C→T [INFERENCE] | `270>><opaque payload>` | `unknown; no fixed example` | Google search constant; generic cast API takes ID/string, not specific270 caller | `DEV.IpMessageConst.TCL_GOOGLE_SEARCH; SDK.TCLGoogleSearchProxy.cast` |
| 271 | both | `271>><JSON {commandType,channel,entity}>` | `271>>{"commandType":2,"channel":"xigua","entity":{"packageName":"com.example.player"}}` | app-diver install0/open1/query2;reply{status,entity} | `SDK.TCLAppDiverProxy.sendDiverParams/handleMsg; SDK.req.DiverRequest; SDK.bean.DiverSenderEntity` |
| 272 | both | `272>><intentParamsMap JSON>;reply272>>{"status":int}` | `272>>{"intentParamsMap":{"com.tcl.cyberui":{"0":{"action":"com.tcl.cyberui.RECENTS","component":{"pkg":"com.tcl.cyberui","cls":null},"category":null,"extraList":null,"flagList":null,"launchType":1}}}}` | enhanced intent launch; returned status interpretation not established | `CMD.RemoteLauncherAppCmd.pack; SDK.TCLCommonProxy.handleMsg; com.tcl.tcast.main.remote.RemoteFragment.onButtonClick` |
| 273 | both | `273>>{"action":0 start/1 stop};reply273>>{"recentApps":[{packageName,label,icon}]}` | `273>>{"action":0}` | subscribe recent apps, not current foreground app | `SDK.TCLCommonProxy.queryRecentApp/handleMsg; com.tcl.tcast.tools.view.ToolsFragment.startQueryRecentApp/stopQueryRecentApp` |
| 274 | T→C | `274>>{"functionCode":"<capabilityString>"}` | `274>>{"functionCode":"1111111111111111111111111111111111111111111111111111111"}` | capability update push | `SDK.TCLCommonProxy.handleMsg` |
| 275 | both | `275>><actionCode>><actionMessage>;reply275>>field1>>scan/clear/state>>cacheBytesOrState[>>memBytes]` | `275>>1>>clear` | overseas cache clean, not power | `CMD.OverseasTVGuardCmd.pack; SDK.TCLOverseasTVGuardProxy.sendClearCacheCommand/parserMsgAndNotifyIfNeed` |
| 276 | both | `276>><BaiduEx JSON>;reply opaque` | `276>>{"commandType":0,"extraMap":[{"key":"token","value":"TOKEN","type":"String"},{"key":"path","value":"/video.mp4","type":"String"}]}` | Baidu screen extension; not screen power | `SDK.TCLCommonProxy.handleMsg; com.tcl.tcast.onlinedisk.view.VideoCastActivity.castVideo` |
| 277 | both | `C→T277>>null;T→C277>><CP string>` | `277>>null` | VOD content-provider query on connect | `SDK.TCLCommonProxy.onDeviceConnected/handleMsg; CMD.CommonCmd.pack` |
| 278 | both | `278>><JSON {commandName,content?,lastListId?,newListId?}>` | `278>>{"commandName":"getSongList"}` | karaoke extension; reply opaque | `com.tcl.tcast.karaoke.core.KaraProtocol.send; com.tcl.tcast.karaoke.bean.Command; SDK.TCLKaraProxy.handleMsg` |
| 280 | C→T | `280>><2 up/3 down>` | `280>>2` | brightness change, not screen-off | `CMD.TCLRenoteSetBrightCmd.pack; SDK.TCLRemoteControlProxy.send280Cmd; com.tcl.tcast.remotecontrol.manager.TouchKeyManager.pressChangeBrightness` |

## 按键完整映射

`DEV.IpMessageConst.TR_KEY_*`（表中去掉前缀），都通过 `CMD.RemoteControlKeyCmd.pack` 发送 `149>><integer>`。这是 SDK 名称，不等于 HA 的命令名；示例：source=`149>>29`、mute=`149>>23`、数字0=`149>>10`。

| SDK key name | Integer |
|---|---:|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |
| 6 | 6 |
| 7 | 7 |
| 8 | 8 |
| 9 | 9 |
| 0 | 10 |
| UP | 11 |
| DOWN | 12 |
| LEFT | 13 |
| RIGHT | 14 |
| OK | 15 |
| BACK | 16 |
| 3D | 17 |
| SUBMENU | 18 |
| MAINMENU | 19 |
| POWER | 20 |
| VOL_UP | 21 |
| VOL_DOWN | 22 |
| MUTE | 23 |
| EPG | 24 |
| DISPLAY | 25 |
| PLAYBACK | 26 |
| CH_UP | 27 |
| CH_DOWN | 28 |
| SOURCE | 29 |
| SCALE | 30 |
| PICTURE | 31 |
| FAVORITE | 32 |
| SEARCH | 33 |
| RED | 34 |
| GREEN | 35 |
| YELLOW | 36 |
| BLUE | 37 |
| BACKSPACE | 38 |
| MOUSELEFT | 39 |
| MOUSERIGHT | 40 |
| INFOWINDOW | 41 |
| SMARTTV | 45 |
| ENTER | 68 |
| DOT | 75 |

主页通常 MAINMENU=19；Linux TV 在能力位置15为1时改用 SMARTTV=45（`SDK.TCLRemoteControlProxy.homeKeyAction`）。SUBMENU=18 是菜单，**OK=15 与 ENTER=68 不同**。PLAYBACK=26 的精确效果手机端未定义；POWER=20 是按键切换，不是幂等关闭。

长按靠重复 `149`：方向键每300 ms重复；音量先发一次，300 ms后每200 ms重复；释放只结束本地循环，没有独立 key-up 线上包。证据：`com.tcl.tcast.remotecontrol.manager.TouchKeyManager.lambda$longClickStartUp$1...`、`longClickEnd`、`touchVolumeUp/Down`。未发现真正 key-down/up 或独立陀螺仪序列化协议。

## 应用记录与查询

### 223 GET / PACKAGEINFO / OPEN

`SDK.AppManagerProxy.getAppData` 发 `223>>GET`，回复：

```text
223>>GET>><record>[><record>...]
record = package::name::icon[::versionCode::versionName::cacheSize::dataSize::codeSize[::systemFlag]]
```

最少3字段，扩展格式8或9字段。**列表内用单个 `>` 分应用，`::` 分记录字段**，不是处处用 `>>`。`systemFlag=0` 表示系统应用，1表示用户应用；缺失标志的解析默认是用户应用（`SDK.bean.TVAppsInfo.parseInfoList/parseInfo`）。合成例子：

```text
223>>GET>>com.example.player::Player::http://tv/icon.png::1::1.0::0::0::1000000::1>com.example.other::Other::http://tv/other.png
```

| 操作 | 精确载荷 / 回复 |
|---|---|
| 启动请求 | `223>>OPEN>><package>`；`SDK.AppManagerProxy.AppItem.getOpenStr` |
| 详情请求 | `223>>PACKAGEINFO>><package>` |
| 详情回复 | `223>>PACKAGEINFO>>package>>name>>icon>>versionCode>>versionName>>cache>>data>>code[>>systemFlag]` |

PACKAGEINFO 使用**外层 `>>` 字段**，不是 GET 的内层 `::` 记录；解析器将索引2以后的字段传给 `TVAppsInfo.parseInfo`。收到 OPEN 子命令回复只触发应用列表/空间刷新，**不证明应用成功启动或当前处于前台**（`SDK.AppManagerProxy.parserMsgAndNotifyIfNeed`）。

### 安装、卸载与进度（协议研究，不是 HA 功能）

| 方向 / 操作 | 载荷与含义 |
|---|---|
| 安装请求 | `223>>INSTALL>>package>>name>>url>>type>>versionCode>>fileSize>>fileMd5>>appMd5>>iconUrl>>filePathMd5` |
| 卸载请求 | `223>>UNINSTALL>>package>>name` |
| 安装回复 | `223>>INSTALL>>package>>field3>>installed/installing/confirm_pending/denied[>>message]` |
| 卸载回复 | `223>>UNINSTALL>>package>>field3>>status[>>message]`；status 1成功、2失败 |
| 进度回复 | `223>>PROGRESS>>field2>>field3>>phase[>>progress][>>field6]`；phase 1下载、3安装、5安装完成 |

安装 `type=1` 为应用商店、2为 unsafe（`AppItem` 默认2）；`fileSize` 为浮点数，单位未知。`confirm_pending` / `denied` 是**应用安装确认状态，不是初始遥控器配对状态**。进度回调顺序为 `updateAppInstallProgress(field3,field2,phase,progress,field6)`；不擅自命名不透明位置。证据：`CMD.AppManagerCmd.pack`、`SDK.AppManagerProxy.AppItem`、`parserMsgAndNotifyIfNeed`。研究未执行安装或卸载。

### 其他上下文查询

- 最近应用：`273>>{"action":0}` 开始订阅，action1停止；回复 `273>>{"recentApps":[{"packageName":"com.example.player","label":"Player","icon":"http://tv/icon.png"}]}`。`SDK.bean.RecentAppInfo` 没有前台标志/当前包名（`SDK.TCLCommonProxy.queryRecentApp/handleMsg`）。
- 当前播放 URL：`257>>1`，回复 `257>>1>><URL>[>>uuid]`；不是打开 URL，也不是应用包名查询。
- 应用参数：`252>>1`，回复 `252>>1>><opaque params>`；`252>>3` 为应用更新。SDK 不解码这些不透明参数（`SDK.TCLChannelProxy` / `SDK.TCLConnectProxy.parserMsgAndNotifyIfNeed`）。

## 输入源与 Intent

最近输入请求 `269>>1`，回复解析器读 `269>><field1>><opaqueInfo>` 的字段2，不检查字段1；切换是 `269>>2>><opaqueInfo>`（`CMD.RecentInputCmd.pack`、`SDK.TCLRemoteControlProxy.getRecentInputs/switchRecentInput/mReceiveMsgListener.onReceiveMsg`）。**此 APK 无法给出 HDMI1/HDMI2 数字映射或 JSON selector schema**；不要把自行猜测的 `HDMI1` 字符串当成有效切换命令。

`149>>29` 是输入源菜单键。手机现代源菜单按钮也使用272增强 Intent，`com.tcl.tcast.main.remote.RemoteFragment.onButtonClick` 的具体包/版本回退事实如下（这是数据描述，不是保证各中国固件可用的请求）：

| 包 / 版本选择键 | action | component.cls | extras |
|---|---|---|---|
| `com.tcl.sourcemananger` / `0` | `com.tcl.insrc.SHOW_WINDOW` | `com.tcl.insrc.ShowWindowService` | null |
| `com.tcl.settings` / `0` | `com.tcl.settings.SHOW_WINDOW` | null | String Type=Source、ITEM=source_manager、MOTION=ENTER |
| `com.tcl.settings` / `40000` | `com.tcl.insrc.SHOW_WINDOW` | `com.tcl.insrc.ShowWindowService` | null |

各项 component.pkg 等于行内包名，category/flagList=null、launchType=0；`sourcemananger` 拼写即研究样本字面量。版本键的服务器回退机制手机端未实现，精确语义未知。

- **263**：`263>><1 activity/2 broadcast>><intentJSON>`；字段 action、category、component{pkg,cls}、extraList[{type,key,value}]、flagList；extras type0=String、1=int、2=boolean（`SDK.TCLCommonProxy.sendIntentParams`、`com.tcl.tcast.util.MeTVUtil.sendIntentParams`）。
- **272**：`272>><JSON>`，`intentParamsMap` 为 包→版本选择键→Intent，并附 launchType。手机示例0用于service/window，1用于activity；此用途不是服务器分派实现证明。回复 `272>>{"status":int}`，状态数值解释未知（`CMD.RemoteLauncherAppCmd.pack`、`SDK.TCLCommonProxy.handleMsg`）。
- **271**：App Diver JSON `{commandType,channel,entity}`，0安装、1打开、2查询；回复 `{status,entity}`。接收 entity 字段 failedReason、packageName、progress(Float)、versionCode(Long)；status=7触发版本查询回调，其余值转交操作状态回调，完整状态含义未建立，不能类比159授权（`SDK.TCLAppDiverProxy.sendDiverParams/handleMsg`、`SDK.req.DiverRequest`、`SDK.resp.DiverResponse`、`SDK.bean.DiverReceiverEntity`）。

**没有发现专门的任意浏览器 URL 打开格式。** 134是准备后原生媒体 URL；224是第三方播放器的 link/player 元数据；257只读播放 URL。用263/272调用浏览器特定组件可能可行，但具体可用 URI/extras 格式仍未知 `[INFERENCE]`，不作为已实现能力。

## 媒体、语音与扩展载荷

### 原生投屏与图像

| 类型 | 准备 / 播放载荷 |
|---|---|
| 视频 | `133>>Video`；`134>>url->title->player->album->coverPath->isPortrait->width->height` |
| 音频 | `133>>Audio`；`134>>url->title->artist->album->coverPath` |
| 图片 | `133>>Image>>angle`；`134>><imageURL>` |
| 音频列表 | `229>><size>><index>><JSON>`；JSON为 `{"list":[{"name":"Song","url":"http://host/a.mp3","singer":"Artist","coverPath":"null","album":"Album"}]}` |

Java null 元数据会序列化为字面量 `null`。是 TV 取 URL 的资源，不是通过6553上传媒体字节（`SDK.bean.VideoInfo.getInfo`、`SDK.TCLAudioPlayerProxy.play`、`CMD.PlaySingleCmd.pack`、`com.tcl.tcastsdk.util.JSONUtils.audioList2JSON`）。原生132/146/147单位为 **ms**，由位置线程按毫秒累加佐证；VOD268 UI 以秒展示，253单位未知，不能混用。

224 的普通第三方视频字段顺序为 `runtype>>playerName>>apkURL>>packageName>>className>>action>>link>>sourceId`；m3u8变体最后为playerParam，不含sourceId。文档投送仅 `224>><url>`。WPS入站变体为 `224>>1>>WPS>>field3>>field4`（`CMD.PlayUnknownVideoCmd/PlayM3u8VideoCmd/DocCastCmd.pack`、`SDK.TCLOnlineVideoPlayerProxy.parserMsgAndNotifyIfNeed`）。

225截图返回0成功（附TV提供HTTP图片URL）、1失败、2/4不支持、3空间不足（`SDK.TCLShotPicProxy.parserMsgAndNotifyIfNeed`）；没有可由样本推出的固定截图HTTP路径。图片旋转、缩放、移动及列表边界见完整消息表。

### VOD 268

请求与回复的 JSON 都带 `commandType`、`extraMap`；extraMap元素为 `{key,value,type}`（`SDK.req.VodRequest`、`SDK.resp.VodResponse`、`SDK.bean.VodExtra`）。`SDK.TCLVodProxy` 的全部发现 selector：

| commandType | 方法 / 动作 | extra |
|---:|---|---|
| 0 / 1 | startVodServer / stopVodServer | 无 |
| 100 / 101 | play / pause | 无 |
| 102 | seekTo | position，Long |
| 103 | stopImageScreen | 无；停止VOD图像投送，不是电视熄屏 |
| 104 | setCurrentQuality | quality，String |
| 105 | setCurrentPlaySpeedRatio | speedratio，Float |
| 106 | setFullScreenPlayState | fullscreenplaystate，Boolean |
| 200 / 201 | getVideoInfo / getPosition | 无 |
| 202 / 203 | getQualityList / getCurrentQuality | 无 |
| 204 / 205 | getCurrentSpeedRatio / getSpeedRatioList | 无 |
| 206 | getAdState | 无 |
| 207 | getFullScreenPlayState | 无 |
| 208 | getPlaybackState | 无 |

合成请求 `268>>{"commandType":102,"extraMap":[{"key":"position","value":"60","type":"Long"}]}`。响应 extraMap 内容依命令而异，由 `VodControlManager` 消费，不是全局电源状态。手机秒制 UI 证据：`com.tcl.tcast.main.remote.RemoteFragment.showVideoInfo/setSeekbarProgress` 使用 secToTime。

### 语音、键盘和鼠标

- 语音：`157>>start` 后使用独立原始 TCP **4332** 流；销毁时 `157>>stop`。`SDK.voice.VoiceControlProxy.AudioClientThread.run` 直接写AudioRecord数据，没有6553帧或AES。`findAudioRecord` 依次尝试采样率16000/44100/22050/11025/8000，encoding 2/3，channel 16/12，取首个可用配置；没有线上格式元数据。默认倾向16kHz PCM16单声道只是基于Android枚举的 `[INFERENCE]`，不是固定格式承诺。
- 识别后文字语音：**`233pcm_text>>1` 开始、`233pcm_text>>2` 停止、`233pcm_text>>6>><text>` 结果**。233后没有 `>>`，不要“修正”为233>>pcm_text。gate为能力位置4=`3`（`CMD.VoiceControlStringCmd.pack`、`com.tcl.tcast.remotecontrol.VoiceControlByString.startVoice/stopVoice/anonymous IVoiceResult.result/supportVoiceByString`）。离线发送bare hello只证明字符串序列化，实际语音文本使用子命令6。
- IME：`155>><text>`，没有发现转义规则；含 `>>` 的文本有解析歧义风险 `[INFERENCE]`。请求键盘是 `249`，推送249>>text、250>>ignored（隐藏）、259>>ignored（打开手机键盘），267是不透明inputHelper回调（`SDK.TCLRemoteControlProxy.mReceiveMsgListener.onReceiveMsg`、`SDK.TCLCommonProxy.handleMsg`）。
- 鼠标：`151>><xInt>><yInt>`，149中的39/40为左右点击；绝对/相对坐标、单位未知。手机触摸手势也会转换成11–16按键（`com.tcl.tcast.main.remote.RemoteFragment`、`TouchKeyManager`）；AIWI156、CLOUD_GAME262常量和能力29并不能证明二进制动作协议。

### AV 264 / 265 / 266

封装 `ID>><context>><JSON>`，context1=mirrorControl，2=videoCall；CommonProxy去掉ID后，`SDK.TCLAvProxy.handleMsg` 仍要求 context与JSON两部分。

| 类型 / 类（`SDK.req` 或 `SDK.resp`） | JSON 字段 |
|---|---|
| AvExchangeRequest（264） | sessionId(Long)、timeout(Integer)、needConfirm(Boolean)、tvVideoParams、tvAudioParams、phoneVideoParams、phoneAudioParams |
| AvGetRequest（265） | sessionId |
| AvOptRequest（266） | sessionId、infoCode |
| AvExchangeResponse（264） | sessionId、tvVideoParams、tvAudioParams、tvControlParams、phoneVideoParams、phoneAudioParams、resultCode |
| AvGetResponse（265） | sessionId、tvVideoParams、tvAudioParams、tvControlParams |
| AvNotifyResponse（266） | sessionId、infoCode、extraMap |

嵌套参数：VideoParams={source,width,height,format,rotate,frameRate,serverParams}；AudioParams={source,sampleRate,channelCount,bitDepth,format,serverParams}；ServerParams={port,type,timeout}。具体媒体传输/状态码未由这些字段声明确定。

### 百度与卡拉 OK

276 的Baidu扩展 JSON `{commandType,extraMap}`：`com.tcl.tcast.onlinedisk.view.VideoCastActivity.castVideo` 使用commandType0并给String类型token/path；BaiduAuthActivity使用1并给token。token是百度账号服务凭据，**不是159遥控器配对密钥**。

278的JSON字段 commandName、可选content、lastListId、newListId；content又是JSON编码字符串。发现命令名：getAppToken、addSong、delSong、delAllSong、disruptSongList、topSong、addAndTopSong、getSongList、getHistorySongList（`com.tcl.tcast.karaoke.core.KaraProtocol.send`、`com.tcl.tcast.karaoke.bean.Command`，研究同时检查了名为KaraConst的常量类）。getAppToken属于扩展应用，不是初始连接授权；回复结构仍不透明。其他账号、历史、清理与通知命令见总表，不应从名称推断电视电源动作。

## 电源、WOL 与授权边界

### 电源与 WOL

`149>>20` 仅 POWER 按键（`SDK.TCLRemoteControlProxy.powerKeyAction`）。手机 `TouchKeyManager.pressPower` 要求已连接；若未设置数字能力mask128，会在3秒后本地断开/离线；设了128则跳过。**本地清理不是TV电源读回**。未发现幂等关机、独立待机、熄屏/亮屏setter或屏幕状态getter。139/145是播放器状态，253是视频进度，UDP3/4不是电源位；258>>0只唤醒已连接TV的Lelink投屏服务，不是待机WOL。

`SDK.TCLRemoteControlProxy.powerOnLan` → `SDK.WakeOnLanUtil.wake` 的WOL事实：

| 参数 | 手机实现 |
|---|---|
| 目的地址 / 端口 | 广播 `255.255.255.255:7778`，UDP |
| 数据 | 6个 `FF` 字节 + 目标MAC的6个字节重复16次，总 **102字节** |
| 次数 | 发送5次，每次发送后睡眠1000 ms |
| MAC输入 | 六个十六进制octet，允许冒号或短横线分隔 |
| 加密 / 连接 | 无TCP控制连接、无AES |

未找到应用调用方或WOL能力gate；MAC由调用者传入。哪一个发现MAC可唤醒、Q9M Pro是否支持、是否要开TV设置、是否支持Wi-Fi待机，都**未验证**。不能把p2pMac/activeMac认定为替代唤醒地址，也不能将广播失败归因为已关机。

### 蓝牙与授权

`SDK.TCLRemoteControlProxy.awaken/getLocalBluetoothMacByRemote/checkRemote` 在此版本Java输出中为空，无法恢复BLE唤醒。蓝牙遥控器配对使用 `241>><BluetoothMAC>`，回复241>>status：0成功、1不支持BLE、2蓝牙不可用、3配对失败、4忙、5未找到、6无效MAC。251>>MAC请求重连，252>>MAC检查本地MAC；它们与T-Channel/应用参数ID冲突。数字mask256用于自动LingXi蓝牙连接，未证明待机唤醒。手机红外功能是独立机制，不属于LAN协议。

159路径的secret固定1，未解析每客户端challenge/token或遥控器配对确认；160>>phoneimei>>phonename只是连接通知，**不证明TV固件永远不会弹确认框**。应用安装有confirm_pending/denied，AV有needConfirm，不能将这些忽略或混为初始配对。`TCLDeviceManager.getCheckPackageFlag` 和 `CheckMethodUtils.isChecked` 是本地SDK包授权/配置gate，不是TV LAN令牌。

固定AES key/IV不提供可靠客户端认证。`[INFERENCE]` 以可信LAN隔离控制端口，不依赖加密常量保护访问；不得公网转发控制端口或公开真实MAC、序列号、TV设备ID、账号/扩展token、家庭IP与返回URL。

## Q9M Pro 实机范围与未知项

以下仅描述本项目既有 **TCL 75Q9M Pro、中国区固件、协议14** 实机观察，不推广到其他型号：

| 能力 | 当前证据 |
|---|---|
| 握手、心跳 | 已实机验证 |
| 音量读取、设置、按键加减 | 已实机验证；协议未声明完整音量范围/最大值 |
| 已安装应用列表 | 已实机验证 |
| 应用OPEN | 格式由手机实现确定；TV启动效果未实机验证，也无前台读回 |
| 其他按键、WOL | 未实机验证效果 |
| 静音读回、输入源列表 | 此实机未取得可用结果；不能据此判定所有TV不支持 |
| 屏幕/电源精确状态、当前前台应用 | 本研究没有建立原生读回；离线只表示可达性变化 |

仍未知：159请求末尾1的意义；发现忽略字段与3/4区分；能力串未映射位置；数字掩码8/16；269选择schema；253初始推送原因/单位；服务器空闲断开阈值；协商后固件混合明/密文行为；WOL目标MAC和设置；130与系统音量的映射。**183/184只有常量定义，不能猜 `183>>` 或 `184>>n`；优先使用有真实序列化证据的130/136/242。** 没有建立任意浏览器URL打开、真key-down/up、独立熄屏或当前前台包名。

静态接收fanout可接受任意ID，未匹配proxy可能忽略它；未知布局不是自动错误，也不是任意猜包的依据。进一步扩展须有目标固件或经授权的实机证据，并继续标明不确定性。
