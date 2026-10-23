# First playable target: four-in-a-row

Explicit user direction: four-in-a-row replaces blackjack as the first target. Chips is the opponent. Use original presentation and branding; working game title undecided. No claim of legal clearance is implied.

Initial implementation proposal: 7 columns, 6 rows, gravity placement, alternate turns, four connected pieces horizontally/vertically/diagonally wins, full board without winner draws. Model receives board, side to move and legal columns, and selects a column. Engine validates moves and computes results. Model choice remains open.

Assets: assets/chips/counter-house-v1.png and counter-player-v1.png are separate transparent imagegen PNGs. House is premium branded burgundy/brass; player is cheap cyan plastic and peeling smiley sticker. They are game counters, not currency. Render both in equal-size board cells with consistent visual scale; intrinsic padding may differ slightly.

Presentation: storybook events and menus, no permanent chatbot required. Governance quiet and out of the UX. Shared equipment, rules modules and authoritative persistent Token ledger remain the architecture. Blackjack and cribbage remain planned games.
