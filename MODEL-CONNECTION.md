# Local model connection test

2026-10-22. Server http://192.168.1.128:1234/v1 lists gpt-oss-20b and google/gemma-4-12b. Active game target remains gpt-oss-20b; no fallback automatically selected.

Named-function object tool_choice rejected by server. String tool_choice=required accepted with only play_turn offered. One immediate horizontal-win fixture returned exactly one structured play_turn call: column 3, board_revision 7, remark Better luck next time. Empty user-facing content. Approximately 10.34 seconds, 1145 completion tokens, of which 1109 reported reasoning tokens. Do not render reasoning in the game.

This is one connection/tool-call smoke test, not evidence of broad strategy reliability or average latency. Next implementation: validate exactly one allowed call, schema, legal column and unchanged board revision; engine applies move and settles outcome. Keep request revision server-side or supply exact constant to avoid interpretation. No model balance writes. Never treat local tool-choice acceptance as permission to skip validation.

Configuration: model-config.json. Raw diagnostic: model-probe.json (contains server-returned reasoning; development-only, never display as Chips dialogue). No app or playable game built by this test.
