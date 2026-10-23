# Chips — handoff, 2026-10-22

## Resume here

The user is opening this folder as a Codex project. They personally played the four-in-a-row prototype and confirmed: "this in fact works." Chips missed an opportunity to win. The user said we can tune it, then hinted at a new idea but paused to save this handoff. They have NOT revealed that idea yet. Let them continue; do not invent it or autonomously expand the game list.

Workspace: `C:\Users\bradl\casino`. Local playable URL: http://127.0.0.1:3210. Node v24.19.0 was available. Zero runtime dependencies. Start with `node server.mjs` if it is not already running; check first to avoid duplicate port binding. The previous chat left the server running. No deployment, hosted Site, external repository, or remote push exists.

Tests: `node --test game.test.mjs server.test.mjs`. Do not run bare `node --test`: it recursively discovers the downloaded design-reference repositories and runs unrelated suites. Package script already uses explicit test filenames.

## What exists

- `server.mjs`: loopback Node HTTP server, static allowlist, state persistence, game actions, local-model call, validation and retry, result settlement.
- `game.mjs`: six-row/seven-column gravity board, legal columns, four win directions, draw detection.
- `public/`: vanilla HTML/CSS/JS playable UI with approved background, transparent house/player counters, column buttons, stakes, optional sound, retry and history. Responsive desktop/mobile checks completed.
- `data/world.json`: LIVE local state. Minimal agent/player node graph, relationship stats, ledger, result memories, current game. Ignored by Git deliberately; preserved on disk. Do not reset it or copy test fixtures into it.
- `model-config.json`: local endpoint/model settings. The server currently hardcodes temperature .5, low reasoning, 4096 max completion tokens and 90s timeout per attempt. Some config fields are descriptive rather than consumed; read server before tuning.
- `README.md`, `FIRST-GAME.md`, `MODEL-CONNECTION.md`: implementation/run notes. MODEL-CONNECTION records the early smoke test, not current model quality.

The prototype is NOT the complete persistent agent architecture. No general graph database, writable memory-curation tools, YAML module loader, invented-game executor, full storybook event engine, or generalized equipment framework has been implemented. Current model access is effectively deny-by-default by exposing only `play_turn`; JSON arguments are validated before state mutation. No model balance-write tool exists.

## Model and turn contract

User chose `gpt-oss-20b` served at `http://192.168.1.128:1234/v1`. Server also listed `google/gemma-4-12b`; it has not been tested or selected. User briefly considered a frontier API but could not find the key. No key was supplied or saved.

OpenAI-compatible Chat Completions. Named-function object `tool_choice` was rejected by local server; `tool_choice: "required"` with exactly one offered function works. Function `play_turn` takes integer column 0-6, string remark (may be empty), and exact current board revision. Server requires exactly one recognized tool call, matching revision and legal column; rejects extra keys and oversized/nonstring remarks. Model text/reasoning is never displayed or parsed as moves. Frontend uses textContent for remarks.

Player move triggers inference. Engine applies the player's legal move first, checks terminal state, then requests Chips' decision only if needed. No continuous thought loop. One invalid-output correction attempt; errors/timeouts preserve board and expose Retry. Stale and postgame moves rejected. Engine computes wins and settles once; Chips cannot grant himself outcomes through speech.

Early test: synthetic midgame immediate-win board, not a real user game, column 3 chosen in 10.34s with 1109 reasoning tokens. Clarified this to user. First real opening turn at low reasoning took 3.06s. Later turns exhausted 1600-token cap without tool calls, so raised cap to 4096. Completed actual zero-stake round: subsequent decisions 13.2s, 31.6s, 56.6s, 16.5s; player won with a straightforward vertical threat. Local model legal tool output works, but speed, strategy and generic remarks remain poor/variable. User independently observed a missed win. Do not claim a strong opponent or that 3s is typical.

Tests passed for gravity/full-column rejection, all win directions, full-board draw, malformed model move correction, manual retry, stale revisions, exactly-once settlement, conserved balances and restart persistence with isolated mock-model test state. Real model full round completed separately. Tests create ignored state under data/tests.

## Persistent product decisions

Original character: Chips. Grey robot, cast silver pompadour, long angular metal face, small inset amber eyes, heavy eyelids, hinged square jaw, crown, tailored charcoal/burgundy suit. Bender + GLaDOS personality influence: dry, greedy, petty, competent, self-interested. Original portrait is canonical. User approved it enthusiastically.

He is house and opponent in opponent-based games. Wants Tokens; cannot arbitrarily edit his balance. Token changes through games; engine owns ledger. Tokens are entirely free, no money, no purchase packs. Earlier Single/Zip/Brick ideas were explicitly dropped. Prototype starts both with 1000; user-triggered free refill adds 1000 each between games. Stakes 0/1/5/10/25/50/100. Wins transfer stake, draws transfer none.

Reusable GAME CLOSET: shared cards, dice, dominoes, counters, boards etc.; individual modules define rules, legal actions, information visibility and settlement. Same persistent Chips across them. Long-term identity/worldstate self-model represented as graph, deny-by-default boundary, explicit memory-curation tools, module YAML expands registry. These remain architecture direction beyond prototype.

Chips may propose unfair/rigged games. User explicitly rejected unsolicited fairness constraints. Deterministic engine can enforce crooked game rules; that does not grant arbitrary balance editing. Don't reintroduce "all games must be fair" as a requirement.

No permanent chatbot necessary. Specific events trigger inference; storybook-style presentation for most events/menus. Four-in-a-row is FIRST target (supersedes blackjack and earlier slots-first talk). Blackjack and heads-up cribbage requested for later; cribbage to 121, pegging/crib/scoring. Blackjack previously discussed hit/stand/double/split, dealer stands on 17, blackjack 3:2, ordinary 1:1, pushes return wager, no insurance initially; implementation not started. Other games are closet possibilities, not an authorized queue to implement now.

## Visual world — vital

Read DESIGN-GUARDRAILS.md and CHIPS.md. User: "no theater anywhere" in UX, no chest beating, unobtrusive governance. This does NOT ban visual excess. Quiet usable controls, spectacularly shameless environment.

Whole-game vibe explicitly approved: `assets/chips/casino-lounge-approved-v1.png`. Chips commissioned himself as God in Renaissance fresco, imperial portraits, absurd heroic souvenir flag, velvet chaise, excessive gilding, brass, marble, dark walnut. Decadent robot-emperor audacity / swap-meet vanity. Original Chips, not an actual politician likeness. Creative reference explicitly: **Vegas Stakes meets Hades meets Groundhog Day**.

House game equipment SUPER premium and branded. Player equipment insultingly cheap but readable/functionally usable. House four-in-a-row counter burgundy enamel/brass embossed Chips; player's pale cyan plastic with molding nub and peeling off-center smiley sticker. Both separate transparent PNGs, corner alpha checked zero. Browser renders them equal size.

User rejected batch-four cartoon drift: do not inflate eyes, soften cheeks, add rubber facial shapes/tongues/tears. Preserve original robot materials/proportions. Varied expression via mechanical articulation and head angle. Stupid situations provide the joke. Batch-four v2 approved. Exit Fee later explicitly rejected as "drift salad" and CUT; never include that panel in exports. User said enough cards, no further card generation unless asked.

## Assets and production limits

All local artwork under `assets/chips/`; original imagegen source files also remain in user's Codex generated_images folder. Project copies are the canonical deliverables.

- chips-approved-v1.png: original character identity.
- casino-lounge-approved-v1.png: whole-game visual direction, integrated.
- counter-house-v1.png / counter-player-v1.png: standalone transparent game pieces, integrated.
- four-in-row-counters-concept-v1.png: comparison sheet.
- four-in-row-cabinet-concept-v1.png: blank playfield cabinet art, reference only. Prototype uses CSS geometry for precise holes; not currently integrated.
- token-faces-v1.png: 1/5/10/25/50/100/500/1000 denomination sheet, user approved. Not separated sprites.
- dice-faces-v1.png: 1-6 sheet, Chips portrait replaces one pip, correct pip counts, not separate assets.
- domino-concept-v1.png: six sample faces 0-0,0-6,1-2,3-4,5-5,6-6 and branded back. NOT a complete 28-tile double-six set. Pip counts visually checked. Needs production generation/extraction if implemented.
- Card sheets: all 52 distinct standard concepts, Audit wildcard, 11 retained unique cards, one back. See CARD-CHECKLIST.md for unique IDs, per-batch approval and known errors. Not a production-ready deck. Several central pip counts wrong; some lower indices wrong. Use deterministic ranks/suits/frame layers when producing playable assets, not imagegen for exact symbols. Exit Fee U012 excluded even though present in archived batch 11 sheet. Last three tens and two other specials retained from that sheet.

## References and repository hygiene

`design-references/impeccable` and `design-references/emil-skills` are local shallow upstream Git clones, intentionally ignored in main repo rather than accidentally added as embedded repositories. Source URLs and commit revisions are in design-references/README.md. They are not globally installed/activated; do not run their installers/hooks implicitly. Borrow visual verification and interaction craft selectively; user's brief overrides imported house styles.

`model-probe.json` contains server-returned reasoning from original diagnostic; ignored and development-only. Never render it as Chips dialogue. No secrets in configuration. Live data and .env ignored. Preserve approved raw art; version revisions rather than overwrite.

## Next conversation

User is ready to share a new idea. Their last product observation: missed win is tuneable. Good next technical options, if requested, include model prompt/representation/eval improvements, latency handling, stronger strategy support explicitly agreed with user, event-driven dialogue and storybook flow. Do not silently replace model decisions with a solver and present them as the model's choices. No changes are required just to resume conversation.

## Update — Liar’s Dice, 2026-10-22

User requested Liar’s Dice. Implemented `liars-dice.mjs`, tests, Game selector, hidden hands, raise/call/reveal, die loss and explicit next rounds. Five dice each, ones wild (only ones for ones bids), ordinary quantity/face ordering without special ones conversion, human opens each round. Whole-match stake settles only when a player runs out of dice. `play_dice` uses the same local model and strict revision/action validation, with retry. Player hand excluded from model context; Chips hand excluded from browser until reveal. Existing saved four-in-row remains intact; server restarted to load changes. Six tests cover rules plus both games’ server flows, settlement, retry and restart using isolated data. `npm test` includes the dice suite.

Live balances remain player 1,010 / Chips 990 and the prior completed four-in-row game is preserved. Actual local-model smoke uses only `data/tests/dice-real-smoke`, port 3211, zero stake; never confuse it with live game data.
Real-model verification succeeded: first request had a transient connection failure; Retry produced a legal raise from 3×4 to 4×1 in 13.748s. Browser Call liar revealed 3 ones, correctly removed one Chips die, and offered Roll next round. Screenshot: data/tests/liars-dice-reveal.png (isolated smoke match). Desktop and narrow layout inspected. No claims about strategic strength or typical latency.
