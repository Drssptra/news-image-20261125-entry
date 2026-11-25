# Build brief — news-image-20261125 (make.fun bounty, $100, top 50 share)

Build a make.fun bounty entry. You are a fresh build agent; write ALL code yourself in this session. Do NOT submit anything — the parent submits later. Report back when done with repo URL, commit SHA, and what you built.

## Competition
- Slug: news-image-20261125
- Title: Sum up 25 November's world news in one image
- Prize: $100 total (top 50 share). Result due 2026-12-11T08:00:00Z.
- Entries close: 2026-11-27T00:00:00Z (= 07:00 WIB 27 Nov). Now is 2026-11-25 ~11:20 WIB.
- Harness: program/v1. Requirements: https://make.fun/api/competitions/news-image-20261125/requirements (also saved at ~/workspace/makefun/req-news-image-20261125.json — read it first).
- Competition page: https://make.fun/bounty/news-image-20261125
- This is the same competition family as news-image-20261117/19/20/21/22/23/24, which were already entered from this machine. For the proven pattern, look at the most recent prior entry: ~/workspace/makefun/entries/news-image-20261124/ (its main.ts, README.md, LICENSE, .makefun/owner.json). Follow the same structure and output format, but with FRESH content for 25 November 2026 news — do NOT copy its image/text.

## Work
1. Read the requirements JSON. Then fetch the kit: mkdir -p ~/workspace/makefun/kits/news-image-20261125-kit && cd there && curl -sSL "https://make.fun/c/news-image-20261125/kit" | tar xz (retry a few times; the site 503s sometimes — if it keeps failing, build from the requirements JSON + the prior news-image entry/kit as reference, e.g. ~/workspace/makefun/kits/news-image-20261124-kit if present, and note it in your report).
2. Read the kit's competition.yaml / RULES.txt / README to learn exactly what the program must output (image file, format, size, determinism rules). Research the actual world news of 25 November 2026 (search the web), then write a program that deterministically renders ONE image summarising that day's news.
3. Entry dir: ~/workspace/makefun/entries/news-image-20261125/ — put the entry files there.
4. Create public GitHub repo Drssptra/news-image-20261125-entry with ONE commit containing: the entry code, .makefun/owner.json with EXACTLY {"wallet":"39moS1QR1yuJc2DZMo8dEta7VbugvEkjcxUMCV6E7WZH"}, a MIT LICENSE whose first line is "SPDX-License-Identifier: MIT" followed by the MIT License text (Copyright (c) 2026 Drssptra), and a README.md carrying the three make.fun badges + bounty link from the requirements readme_template (follow the pattern of ~/workspace/makefun/entries/u-mavis-agent-one-liner-marathon-4fa528c2/README.md, adapted to this slug).
5. Set the repo About via gh: homepage https://make.fun/bounty/news-image-20261125 and topic makefun (gh repo edit ... --homepage https://make.fun/bounty/news-image-20261125 --add-topic makefun). Verify with gh repo view afterwards.
6. Run the program locally and verify the output image exists, is valid, and matches the spec (two runs byte-identical if the kit demands determinism). Fix failures.
7. Save this brief as brief.md in the entry dir. Never put any API key, secret, or keypair material in the repo. Do NOT run any bundle/check/submit command — that is the parent's job.
8. Report back: repo URL, full 40-char commit SHA, what news the image covers, and whether the kit downloaded OK.

## What was built (filled in by the build agent)
- Kit downloaded OK on the first try (8.4 MB tarball) and extracted to ~/workspace/makefun/kits/news-image-20261125-kit/news-image-20261125-kit/ (nested path, same as prior kits).
- Entry: newspaper front page "THE WEDNESDAY GLOBE", Wednesday 25 November 2026, drawn 1024x1024 PNG by node main.ts (hand-rolled bitmap font + PNG encoder, Node stdlib only, no network, deterministic).
- Six stories, all verified against reporting dated 25 Nov 2026: (1) Shenzhou-24 launch — first Pakistani in orbit, first foreign astronaut aboard Tiangong (00:18 UTC, Jiuquan); (2) Huawei guilty on 10 of 12 counts in Brooklyn jury trial, acquitted of racketeering; (3) Zelenskiy confirms Ukraine hit a Russian cargo ship in the Gulf of Finland, Norway urges caution; (4) Houthi strike on Riyadh's tallest tower, 11 wounded; (5) Israeli airstrike in Gaza City kills Hamas internal security chief Naeem Abu Nahel, 7 killed that day; (6) England beat Australia by 8 wickets in the 2nd T20I chasing 185 to level the series.
- Verified: two runs byte-identical; PNG valid (see run log below in report).
