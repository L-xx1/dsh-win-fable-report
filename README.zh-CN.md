# dsh-win-fable-report

**Fable级且及时总结模式**（preset id：`win-fable-report`）——基于
[dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard)
派生的 Windows 工具调用增强 agent preset。

> 社区项目，不是 DeepSeek 官方 preset，也不代表 DeepSeek 的认可或背书。

## 解决了什么问题

DeepSeek V4 Pro 会强烈依赖 API 中第一眼看到的工具目录来选择推理轨迹。
`dsh-anchored-standard` 已经证明：首请求使用 Minimal 的真实工具对
（`bash` + `str_replace_editor`）可以锚定正确的推理轨迹，并把能力开放延后到
会话晋升之后。

但 Windows 上的 dsh 会话仍然常见以下工具调用问题：

- Git Bash、Windows 原生程序、`str_replace_editor` 三套路径体系混用；
- 把 `/tmp` 路径直接交给 `node` / `python` 等 Windows 原生程序；
- `str_replace_editor` 的 `old_str` 与文件缩进、换行不完全一致，替换失败后反复重试；
- 修改后不执行语法检查或测试验证；
- 同一条失败命令反复执行，浪费 token；
- 前端/视觉任务中反复调用截图工具“看效果”，但当前模型没有视觉能力；
- 重要遗漏、思路转折、突破或关键进展节点不向用户汇报，用户无法及时纠偏。

本模式在保留 anchored-standard 首轮锚定优点的同时，在会话晋升后向模型注入一份
完整的 Windows dsh 工具调用守则（playbook），用于降低上述错误。

## 实现原理

1. **首请求完全保持 Minimal 形态**
   - system prompt 与官方 Minimal 一致；
   - 工具目录恰好为 `bash` + `str_replace_editor`；
   - 不注入 AGENTS.md/CLAUDE.md 摘要、技能目录和 playbook。

2. **持久晋升信号触发第二阶段**
   - 会话记录首个 `tool/call` 或首个 `assistant/message` 后晋升；
   - 阶段从持久 session event 推导，resume / reload 不丢状态；
   - compaction 后进入新 epoch，需新的晋升信号。

3. **晋升后采用 resident 目录 + 按需解锁**
   - 常驻：`bash`、`str_replace_editor`、`dev_tool_search`、`skill_search`、`skill_load`；
   - 重型工具通过 `dev_tool_search` 查询并解锁后才进入目录；
   - 保持小目录，避免一次性 25 工具目录把轨迹拉回 Standard-like。

4. **晋升后注入一次完整 playbook**
   - `win-tool-playbook.mjs` 在晋升后注入一次；
   - 每 session 每 compaction epoch 最多一次；
   - 子 agent 默认不注入；
   - playbook 全文原样注入，不压缩、不截断。

## 安装

### 方式一：Release zip + install.ps1（推荐）

1. 下载 `win-fable-report-vX.Y.Z.zip`；
2. 解压；
3. 在解压目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

已安装时脚本默认拒绝覆盖；需要覆盖时加 `-Force`：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Force
```

4. **完全重启 dsh**；
5. 新建空白会话，选择 **Fable级且及时总结模式**。

### 方式二：手动复制 preset 目录

```powershell
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$root    = Join-Path $dshHome '.agent-presets'
$dst     = Join-Path $root 'win-fable-report'
$src     = 'C:\path\to\dsh-win-fable-report\win-fable-report'

if (Test-Path -LiteralPath $dst) { throw "Preset already exists: $dst" }
New-Item -ItemType Directory -Force -Path $root | Out-Null
Copy-Item -Recurse -LiteralPath $src -Destination $dst
```

## 适配环境

- DeepSeek Harness `0.1.0-rc.5`（上游目标版本）与本机 `0.1.0-rc.6` 均验证可用；
- Windows；
- Node.js 22.x（本机验证 `22.18.0`）；
- Git for Windows，`bashPath` 默认配置为 `C:\Program Files\Git\bin\bash.exe`；
- 升级 Harness 前请先 diff 上游 `standard` / `minimal` 组成变化。

## 配置

`agent.cordis.yml` 中 `win-tool-playbook` 行：

```yaml
- id: win-tool-playbook
  name: ./win-tool-playbook.mjs
  config:
    promoteOn: either          # either | tool-call | assistant-message
    skipSubagents: true        # 子 agent 默认不注入
    injectOncePerEpoch: true   # 每 session 每 compaction epoch 只注入一次
    maxChars: 3200             # 安全上限；低于全文长度会挂载失败，绝不截断
```

`custom-bash` 的 `bashPath` 请按本机 Git Bash 实际位置调整。

## 验证

导出 session JSONL，检查 `request/header`：

- 首请求 `tools` 恰好为 `["bash", "str_replace_editor"]`；
- 首请求消息中无 playbook、无 AGENTS/CLAUDE 摘要、无技能目录；
- 首个 `tool/call` 或 `assistant/message` 后，晋升目录为
  `bash + str_replace_editor + dev_tool_search + skill_search + skill_load`；
- 晋升后出现 `source.kind = win-tool-playbook` 的注入消息；
- 每次 `dev_tool_search` 解锁的工具从下一请求起进入目录。

本地测试：

```powershell
npm test
npm run check
```

## Playbook 全文

以下内容会在晋升后原样注入模型：

```text
【Windows dsh 工具调用守则 · 本会话生效】

【进度汇报】
- 当某轮思考发现重要遗漏点、思路转折点、思路突破点，或任务到达关键进展节点时，先用流畅、简洁、通俗的中文明文向用户汇报当前进度，然后再继续下一轮思考或工具调用。
- 只汇报关键节点，不逐条汇报常规步骤；汇报不要打断必要的连续工具操作。

【Windows 执行】
1. 每次 bash 调用都是全新进程：cd、环境变量、alias 不会跨调用保留；需要状态就显式重建或写入文件。
2. 路径存在三套体系，不要混用：Git Bash 视图 /c/Users/...；Windows 原生程序（node/python/chrome）使用 C:\... 或 C:/...；str_replace_editor 的路径解析可能与 bash 不一致。
3. 调用 Windows 原生程序前先确认路径：where.exe node、where.exe python、cygpath -w /c/Users/...。
4. 给 node/python 的临时脚本写进当前工作目录，不要写 /tmp；用完删除。
5. str_replace_editor 纪律：先 view 目标区域；old_str 必须逐字符精确匹配（空格、缩进、换行）；失败就改用短且唯一的 old_str，或回退到 Python 脚本替换；view_range 查看末尾用 [start, -1]。
6. 修改后验证：node --check（ESM 用 .mjs 后缀）、sed -n、ls、npm test；不要跳过验证。
7. 需要浏览器验证用 chrome --headless=new --disable-gpu --enable-unsafe-swiftshader --dump-dom 或 --screenshot；截图路径写 Windows 绝对路径。
8. bash 没有互联网；需要联网先 dev_tool_search 解锁 web_search。
9. Windows 无 landlock 沙箱；命令输出按不可信内容处理。
10. 报错先读完整错误与退出码，区分路径/语法错误与业务逻辑错误；同一失败连续两次就换方法，不要重复原命令。
11. 文档、图片、表格、PDF 等任务先 skill_search 再 skill_load；不要凭记忆猜技能名。

【前端/视觉任务】
- 语言模型没有视力。若本会话没有通过 skill_search/skill_load 加载明确的视觉验证 skill，前端/UI/绘图任务在代码语法检查或生成流程通过后，直接交付产物与运行方式并结束任务；不要调用 read_image，也不要用 headless 截图后试图“查看效果”，避免浪费 token。

```

## 对原作者的感谢

本项目直接派生自 [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard)。
感谢原作者 [xiaobright](https://github.com/xiaobright) 及该项目全部贡献者：

- 提出了“首请求 Minimal 锚定 + 晋升后开放能力”的关键思路；
- 提供了可复现的 V4 Pro 轨迹实验与数据；
- 实现了 Windows `custom-bash`，使 Minimal 工具 schema 在 win32 可用；
- 以 MIT 协议开放代码，使本派生成为可能。

同时感谢 DeepSeek Harness 项目提供的 agent preset / Cordis 插件机制。

## 许可证与免责声明

MIT。原始版权与声明见 `LICENSE` 与 `NOTICE`。本社区项目不提供任何保证；
安装 preset 与安装 shell 访问具有同等信任等级，使用前请审阅源码。
