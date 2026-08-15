# dsh-win-fable-report

**Fable级且及时总结模式**（安装目录名：`win-fable-report`）

这是一个给 Windows 版 DeepSeek Harness（dsh）用的预设模式。它让 DeepSeek V4 Pro 先用更稳的方式开始工作，并且在重要节点用一句通俗的中文向用户汇报进展。

## 它解决什么问题

- 模型一上来看到太多工具，容易绕远路、说空话；
- Windows 上路径和编辑器工具容易用错，改了不验证，同一条失败命令反复执行；
- 前端任务里模型没有视觉能力，却反复截图“看效果”，浪费 token；
- 关键进展用户看不到，问题不能及时纠正。

## 它怎么工作

1. 第一轮只给模型两个基础工具：`bash` 和 `str_replace_editor`，让它沿正确轨迹启动；
2. 模型真正开始动手，或给出第一次回答后，开放常驻小工具；重型工具按需解锁；
3. 随后注入一份《Windows 工具使用守则》，告诉模型路径怎么写、改完怎么验证、什么时候不要截图；
4. 模型遇到重要遗漏、思路转折、突破或关键节点时，先用简洁的中文向用户汇报，再继续干活。

## 怎么安装

### 路径对照（先看清这两层目录）

| 路径 | 含义 |
| --- | --- |
| `C:\dev\dsh-win-fable-report` | 你克隆项目的地方，位置随意 |
| `C:\dev\dsh-win-fable-report\win-fable-report` | 源：项目里的 preset 目录 |
| `C:\Users\<你>\.dsh` | dsh 自己的数据目录 |
| `C:\Users\<你>\.dsh\.agent-presets` | dsh 查找用户 preset 的目录 |
| `C:\Users\<你>\.dsh\.agent-presets\win-fable-report` | 目标：安装后的 preset |

`.dsh` 和项目克隆目录没有父子关系，可以放在不同磁盘。它们的唯一联系，就是下面这条复制命令：

```text
项目里的 win-fable-report  ──复制──>  .dsh\.agent-presets\win-fable-report
```

不要反过来，也不要把项目克隆到 `.dsh` 里面。

### 推荐：Git 克隆 + 一条命令安装

```powershell
git clone https://github.com/L-xx1/dsh-win-fable-report.git
cd dsh-win-fable-report
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

`install.ps1` 会自动完成上面这个复制动作。

### 不想执行脚本：直接复制

```powershell
git clone https://github.com/L-xx1/dsh-win-fable-report.git
cd dsh-win-fable-report

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$dst     = Join-Path (Join-Path $dshHome '.agent-presets') 'win-fable-report'

Copy-Item -Recurse -LiteralPath '.\win-fable-report' -Destination $dst
Test-Path (Join-Path $dst 'agent.cordis.yml')   # 应返回 True
```

### 安装后加载

1. 完全重启 dsh；命令行启动可执行 `dsh web`（等于 `dsh --profile web`）；
2. 新建一个空白会话；
3. 选择 **Fable级且及时总结模式**。

> 安装脚本默认不覆盖已有文件；确需覆盖时加 `-Force`。
> 不要在已有对话的会话上切换本模式。

## 使用环境

- Windows；
- DeepSeek Harness `0.1.0-rc.5` / `0.1.0-rc.6`；
- Node.js 22.x；
- Git for Windows。

## 详细说明

安装、配置、验证方法和《Windows 工具使用守则》全文，见 [README.zh-CN.md](README.zh-CN.md)。

## 致谢

本项目基于 [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) 制作。感谢原作者和该项目所有贡献者，以及 DeepSeek Harness 项目。

## 许可

MIT。本项目不是 DeepSeek 官方项目，安装前请先查看源码。
