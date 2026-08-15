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

Download a release zip, extract it, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

Use `-Force` to overwrite an existing install. Fully restart dsh, create a blank session, and select **Fable级且及时总结模式**.

Manual install: copy the `win-fable-report/` directory into `<DSH_HOME>\.agent-presets\win-fable-report`.

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
