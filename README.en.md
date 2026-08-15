# dsh-win-fable-report

**Fable-Level, Just-in-Time Summary Mode** (preset id: `win-fable-report`) —
a Windows tool-calling enhancement preset derived from
[dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard).

> Community project. Not an official DeepSeek preset and not affiliated with or endorsed by DeepSeek.

## What problem it solves

`dsh-anchored-standard` shows that bootstrapping the first request with the
official Minimal tool pair (`bash` + `str_replace_editor`) anchors a better
V4 Pro reasoning trajectory, then unlocks more capabilities after promotion.

This derivative keeps that anchor and adds a post-promotion Windows tool-calling
playbook that targets recurring Windows dsh failures:

- mixing Git Bash / Windows-native / editor path systems;
- passing `/tmp` paths to Windows-native `node`, `python`, or `chrome`;
- retrying `str_replace_editor` replacements without byte-exact `old_str`;
- skipping `node --check` / tests after edits;
- repeating the same failing command instead of changing approach;
- wasting tokens trying to "view" frontend output when no vision skill is loaded;
- not reporting important omissions, turning points, breakthroughs, or key progress nodes to the user.

## How it works

1. First request stays Minimal-exact: Minimal persona, `bash` + `str_replace_editor`, no injected workspace/skill/playbook context.
2. The first durable `tool/call` or `assistant/message` promotes the session (epoch-aware, resume-safe).
3. Promoted catalog stays small: `bash`, `str_replace_editor`, `dev_tool_search`, `skill_search`, `skill_load`; heavier tools are unlocked on demand.
4. After promotion, the full Windows dsh playbook is injected once per session per compaction epoch. It is never compressed or truncated.

## Install

### Path map: the clone directory vs `.dsh`

| Path | Meaning |
| --- | --- |
| `C:\dev\dsh-win-fable-report` | Where you clone the project (any location) |
| `C:\dev\dsh-win-fable-report\win-fable-report` | Source: the preset directory inside the project |
| `C:\Users\<you>\.dsh` | dsh data directory (`DSH_HOME`, under your user profile) |
| `C:\Users\<you>\.dsh\.agent-presets` | Root where dsh discovers user presets |
| `C:\Users\<you>\.dsh\.agent-presets\win-fable-report` | Destination: the installed preset |

The clone directory and `.dsh` are unrelated; they can live on different drives. The only connection is one copy, in this fixed direction:

```text
<clone>\win-fable-report  ──copy──>  <DSH_HOME>\.agent-presets\win-fable-report
```

Do not clone the project inside `.dsh`, and do not copy in the opposite direction.

### Option 1: git clone + install.ps1 (recommended, shortest)

```powershell
git clone https://github.com/L-xx1/dsh-win-fable-report.git
cd dsh-win-fable-report
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

`install.ps1` performs exactly that copy. Use `-Force` to overwrite an existing install.

### Option 2: git clone + direct PowerShell copy

```powershell
git clone https://github.com/L-xx1/dsh-win-fable-report.git
cd dsh-win-fable-report

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$dst     = Join-Path (Join-Path $dshHome '.agent-presets') 'win-fable-report'

Copy-Item -Recurse -LiteralPath '.\win-fable-report' -Destination $dst
Test-Path (Join-Path $dst 'agent.cordis.yml')   # should return True
```

### Load the preset after install

1. Fully restart dsh. From the command line you can start it with `dsh web` (same as `dsh --profile web`).
2. Create a blank session.
3. Select **Fable级且及时总结模式**.
4. Do not switch an active session to this preset.

## Compatibility

- DeepSeek Harness `0.1.0-rc.5` (upstream target) and `0.1.0-rc.6` (locally verified);
- Windows, Node.js 22.x, Git for Windows;
- review upstream `standard` / `minimal` changes before upgrading Harness.

## Playbook

See [README.zh-CN.md](README.zh-CN.md) for the full Chinese playbook text and detailed verification steps.

## Thanks

This project derives from [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard).
Special thanks to [xiaobright](https://github.com/xiaobright) and all contributors for the anchored-standard idea, the reproducible V4 Pro experiments, the Windows `custom-bash` implementation, and the MIT-licensed code.

## License

MIT. See `LICENSE` and `NOTICE`.
