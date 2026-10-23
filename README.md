# Chips — first playable

Local four-in-a-row against `gpt-oss-20b` at `http://192.168.1.128:1234/v1`. No packages to install. Node 22+.

Run from this folder:

```powershell
node server.mjs
```

Open http://127.0.0.1:3210. Choose a stake (including zero) and take a seat. Column buttons drop a counter. Chips receives the resulting board and must submit `play_turn` with column, matching revision and optional remark. Arrow buttons work with keyboard focus and Enter/Space. Sound is optional and off initially.

The game engine owns gravity, legal columns, win/draw detection, turn order, and Token settlement. No model-authored code, balance edits, arbitrary tools or prose parsing. Invalid tool calls get one correction attempt; failed/timeout turns leave the player's move intact and expose Retry. Both parties start with 1,000 free Tokens. Refills add 1,000 to each through an explicit user action between rounds. These are fictional free Tokens, no purchases or cash value.

State is stored in `data/world.json`: minimal agent/player graph, relationship counters, ledger, result memories and current board. Reloads/restarts preserve it. This is a prototype graph representation, not yet the complete self-model, memory-curation registry, game invention system or storybook event engine. There is no continuous model loop and no permanent chatbot.

Change server/model in `model-config.json`, then restart. Model turn requests currently use low reasoning effort, a 4,096-token budget and a 90-second timeout per attempt. The server supports `tool_choice: "required"`; named-function forcing was rejected. The server binds only to loopback. To use a different local port set `$env:PORT` before starting.

Tests:

```powershell
node --test game.test.mjs server.test.mjs
```

Tests cover gravity/full columns, all winning directions, draw, invalid model moves, retry, stale revisions, exactly-once settlement and restart persistence using isolated test state and a mock model. The actual local model also completed a zero-stake round. Observed latency ranged from 3.1 seconds to 56.6 seconds; this is a small sample, not a benchmark. Raising the response budget recovered a turn that previously exhausted its budget without returning a tool call. Strategy and dialogue quality remain variable.

Approved backdrop and standalone counter PNGs are integrated. The generated cabinet remains a concept reference; this playable board uses code geometry for accurate holes. Existing card/dice/domino sheets are concept art; dominoes are not yet a full playable set. See `assets/chips/CARD-CHECKLIST.md` for tracked card corrections.
