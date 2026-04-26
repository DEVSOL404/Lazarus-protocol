# Demo recording guide

This is the script for recording the official 90-second demo video — the kind of video that lands a hackathon shortlist.

You have two options:

| Option | Effort | Output |
|---|---|---|
| **A — Screen-record `demo.html`** | 5 min | 90s MP4 of the auto-playing walkthrough page. Lowest-effort path. Works without deploying anything. |
| **B — Record an actual product walkthrough** | 30-45 min | 90s MP4 narrated over the live app (`index.html` + `app.html`). Higher effort, more credible. **Required for top-tier scores.** Both are good. Option B is *the* video. |

> Recommendation: do **A first** (5 minutes, immediately shippable), then upgrade to **B** before the deadline if you have time.

---

## Option A — Screen-record `demo.html`

The `demo.html` page is a self-running 90-second cinematic walkthrough — captions, animated UI, virtual cursor, scene transitions. It plays the same way on every machine.

### Steps

1. Open `demo.html` in Chrome or Edge fullscreen (F11).
2. Press **R** to restart from the top, or just wait for it to loop.
3. Start screen recording:
   - **Mac:** Cmd-Shift-5 → "Record selected portion"
   - **Windows:** Win+G → Game Bar → Record
   - **OBS / Loom:** any region capture, 1920×1080, 60fps
4. Press **Space** when the page is at 00:00 to ensure clean start.
5. Record for **92 seconds** to capture the full loop plus a beat of breathing room.
6. Stop, trim to start at the moment caption fades in, end on the final lockup.
7. Export H.264 MP4, 1080p, ~8-10Mbps.
8. Upload to YouTube (unlisted) or Loom. Drop the link in `README.md` `Links` section.

### Tip

`demo.html` includes a virtual cursor that animates over the dashboard scene. You don't need to touch the page during recording — it auto-pilots. Just record, trim, ship.

---

## Option B — Record the actual product

This is the version a hackathon judge respects most: real wallet, real signing, real on-chain transactions visible in the explorer.

### Pre-recording checklist

- [ ] Contracts deployed to Base Sepolia (`npm run deploy:sepolia`)
- [ ] Addresses pasted into `js/contract.js` chain `84532` entry (`address` + `registryAddress`)
- [ ] App deployed to Vercel; the URL works
- [ ] MetaMask installed, with a fresh test wallet you don't mind being on camera
- [ ] Test wallet funded with ~0.05 Base Sepolia ETH from the faucet
- [ ] Browser zoomed to **110-125%** (looks better on video, easier to read on small screens)
- [ ] Notifications muted (Slack, Discord, system, browser)
- [ ] Quiet room with no background music or AC hum

### Recording setup

- **Resolution:** 1920×1080, 60fps
- **Audio:** Voiceover via a half-decent USB mic (any modern earbud mic is fine), recorded separately if your screen recorder allows
- **Tools:** OBS (free, best), Loom (easy, hosted), or Camtasia
- **Cursor:** enable cursor highlight in your recorder so the judge can see where you click

### The 90-second script

Each line is a beat. Read with conviction. Pauses in the timing column let visuals breathe.

| Time | Voiceover (read aloud) | What's on screen | Action |
|------|------------------------|------------------|--------|
| **0:00 — 0:05** | "Every year, billions in crypto get lost forever. Lost keys, owners gone silent, families locked out." | `demo.html` Scene 1-2 OR your landing page hero scrolling slowly | Start recording on the cold black, fade in to the headline. |
| **0:05 — 0:18** | "Lazarus is an insurance layer on the wallet you already use. It reads on-chain activity. It never intercepts a transaction. The wallet stays yours." | Scroll through the landing hero, pause on "Insurance layer · not a new wallet" tag, then the protection-score playground | Slow scroll, no fast cuts. |
| **0:18 — 0:30** | "Connect MetaMask. Auto-switches to Base Sepolia. The topbar reads LIVE — every action from here is a real transaction." | Click "Open app" → Connect Wallet → MetaMask popup → approve. Show the topbar going from `SIMULATION` to `LIVE · ON-CHAIN` | First on-chain proof. Critical shot. |
| **0:30 — 0:45** | "I claim a handle. Rosa. Three letters, free, just gas. The dashboard greeting updates: 'You're covered, @rosa.'" | Settings → Identity → type `@rosa` → Claim → MetaMask sign → confirmation toast → greeting updates | This is the tx hash money shot. Show MetaMask, the sign, the confirmation, and the on-chain change. |
| **0:45 — 1:00** | "Three roles: Confirmers verify, Custodians can file petitions, Watchers can veto. The contract enforces: anyone who voted on a petition can never receive funds from it." | Pan to Roles tab → show invite composer → maybe accept a self-invite | Talk over the role explanation — the camera is just exploring. |
| **1:00 — 1:15** | "If your wallet goes silent past your baseline, the score drops. A Custodian files an emergency petition. Five phases: file, commit, reveal, challenge, execute." | Click the demo "Simulate silence" button (`simulateSilence()` view) → score drops to 45 → file petition modal | Score-drop animation + petition modal opening = strong visual. |
| **1:15 — 1:25** | "Commit-reveal blinds the vote. A 72-hour challenge window. The owner has one click to come back: resurrect. Time alone never triggers a release." | Petition status pills lighting up → click Resurrect → petition is cancelled → score back to 100 | Show the resurrection. The whole product is justified by this one moment. |
| **1:25 — 1:30** | "Lazarus. Open source. Live on Base." | Cut to the Lazarus mark, brand title, URL underneath | End on the lockup. Hold for 2 seconds before stopping. |

### What to cut, what to keep

- **CUT:** typing wallet addresses, MetaMask popup loading delays, any waiting for a tx confirmation longer than 2 seconds (use jump cuts)
- **KEEP:** the moment you click Sign in MetaMask, the moment a status flips on-chain, the moment the score animates
- Use a 50-100ms cross-dissolve between scenes, never a hard cut. Hard cuts feel amateur.

### Voiceover

Record voiceover **separately** from the screen recording. Reasons:
- You can re-take a botched line without re-doing the screen capture
- Voice has zero background noise from the screen-record process
- You can apply light EQ + compression in Audacity (free) to make it sound professional

Settings:
- 48kHz 16-bit WAV → trim → bus to a compressor (Audacity → Effects → Compressor: 3:1, -18dB threshold) → noise gate at -50dB → normalize to -3dB
- Sit back from the mic 6-12 inches, not lips-on. Drink water before. Speak slowly — slower than feels natural.

### Editing

Use **DaVinci Resolve** (free, professional) or **CapCut** (free, easier).

Layers:
1. Screen recording on V1
2. Voiceover on A1, with a -1.5dB ducking sidechain on a music bed
3. Optional: gentle music bed on A2 (royalty-free from YouTube Audio Library — search "ambient cinematic")
4. Subtitle track — auto-generated from the script above, placed at the bottom in a clean Inter font

Export:
- 1920×1080, H.264, 8-10Mbps, AAC audio at 192kbps
- Two versions: a 90-second cut for hackathon submission, a 60-second cut for Twitter/social

---

## Where to put the final video

1. **README.md** `Links` section — replace "Demo trailer: built into the landing page" with `[2-min demo (YouTube)](your-link)` or similar
2. **Landing page** — there's already a `<a href="#trailer" data-trailer-open>` button. Wire `trailer.js` to play the recorded MP4 instead of the live cinematic, OR keep the cinematic and add a separate "Watch the walkthrough" button
3. **Vercel deploy** — the demo MP4 should be hosted on YouTube/Loom, not in the repo (don't commit large binaries to git)
4. **Hackathon submission form** — paste the link wherever it asks for "Demo video URL"

## Checklist before submission

- [ ] Demo video is exactly 90 seconds (or under 2 minutes if Option B with extra context)
- [ ] Audio is clean, no background hum
- [ ] All MetaMask popups are blurred or panned away from screen edges (in case test wallet shows balance)
- [ ] You don't accidentally show a private key, seed phrase, or `.env` content
- [ ] The video is set to **Unlisted** on YouTube, not Private (judges can't view Private videos)
- [ ] Title format: `Lazarus Protocol — 90s walkthrough — [hackathon name]`
- [ ] Description has: 1-line summary, GitHub link, live URL, contract address on Basescan

---

## If you really only have 5 minutes

Open `demo.html`, hit F11, press R, screen-record it, upload to YouTube unlisted, drop the link in README. That's a credible submission floor. It scores ~6.5/10 on Demo. The full Option-B walkthrough scores ~8.5/10. Pick based on time available.
