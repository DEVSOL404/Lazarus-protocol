# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Lazarus Protocol is a crypto continuity insurance product. It monitors a user's wallet activity as a passive heartbeat and orchestrates an orderly response (alerts, pre-written instructions, emergency fund access) when they go silent. Normal transactions are unaffected — it's an insurance layer, not a replacement wallet.

Built for a hackathon. No build tooling. Open HTML files directly in a browser.

## Running the Project

```bash
# Landing page — open directly in browser
start index.html          # Windows
open index.html           # Mac

# Dashboard
start app.html

# Smart contract — no Hardhat/Foundry setup yet
# Deploy manually via Remix IDE (remix.ethereum.org) or set up Hardhat:
# npx hardhat init  (not yet scaffolded in this repo)
```

No build step, no `npm install`, no dev server required. All CSS and JS are inline in the HTML files. Only external dependency is Google Fonts (CDN).

## Architecture

### Frontend (`index.html`, `app.html`)
Pure vanilla HTML/CSS/JS. No frameworks. Self-contained files — everything inline.

**`index.html`** — Marketing landing page
- Intro animation sequence: black screen → pulsing dot → "ARE YOU PROTECTED?" types in → dot explodes into canvas particle network → hero fades in. Controlled by `#intro` element and `introSequence()`.
- Two canvas elements: `#intro-canvas` (explosion) and `#hero-canvas` (persistent node network). Both use the same node/edge physics pattern.
- Scroll animations via `IntersectionObserver` watching `.reveal` elements.
- Interactive terminal demo: `runSimulation()` / `resetSimulation()` — types log lines character by character with `typeLogLine()`.
- Stats count up on scroll via `animateCountUp()`.

**`app.html`** — Dashboard application
- Two distinct modes controlled by showing/hiding `#onboarding` vs `#dashboard`.
- Onboarding: 7-step flow. Each step is a `div.onboarding-step[data-step="N"]`. Navigation via `nextStep()` / `prevStep()`. State stored in `appState` object.
- Dashboard: tab-based. Active tab controlled by `switchTab(tabName)`. Tab content panels are `div.tab-panel[data-tab="name"]`.
- Sidebar collapse: `toggleSidebar()` adds `.collapsed` class.
- Vitality Score ring: SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset` animated via `setVitalityScore(n)`.
- `appState` object holds: `connected`, `walletAddress`, `vitalityScore`, `confirmers[]`, `custodians[]`, `watchers[]`, `petitions[]`, `silenceWindowActive`.
- Simulation: `simulateSilence()` uses `setInterval` to decrement score. `resurrect()` increments it back.

### Design System (both files)
```css
--void: #000000        /* section backgrounds */
--deep: #06060f        /* body background */
--surface: #0d0d1a     /* card backgrounds */
--glass: rgba(255,255,255,0.04)
--border: rgba(255,255,255,0.08)
--purple: #8b5cf6      /* primary accent */
--green: #22c55e       /* alive / healthy */
--red: #ef4444         /* danger / silent */
--amber: #f59e0b       /* warning */
--gold: #eab308        /* Trust Badge */
```
Fonts: `Syne` (headlines, 800 weight), `Inter` (body), `JetBrains Mono` (addresses, scores, terminal).

### Smart Contract (`contracts/Lazarus.sol`)
Single contract `LazarusProtocol`, Solidity ^0.8.19. No OpenZeppelin dependencies — fully self-contained.

**Role system** — `enum Role { None, Confirmer, Custodian, Watcher }`. The core invariant enforced at the contract level: a Confirmer who votes on a petition (`confirmerVotedOnPetition[petitionId][addr] = true`) is excluded from receiving funds in `executePetition()`. Custodians cannot hold the Confirmer role (`grantRole` reverts if the conflict exists).

**Petition lifecycle**: `Pending → UnderReview → VotingClosed → Approved/Rejected → Executed/Expired`. Votes are blind — `Vote.approved` is readable only after `votingClosedAt + CHALLENGE_WINDOW (72 hours)`. Execution requires `approveVotes >= MIN_CONFIRMER_VOTES (2)` and the challenge window to have elapsed.

**Vitality Score** — `vitalityScore()` is a pure view function. Returns 100→0 based on `daysSinceActivity()`. If a `SilenceWindow` is active and unexpired, returns 95 (healthy signal). Production note in the contract: this is simplified — the full score incorporates off-chain signals (escalation responses, role network health) via the indexer.

**`simulateSilence()`** — sets `lastActivity` to 45 days ago. For hackathon demos only. Call via Remix or Hardhat console during live demo.

**Fee**: `RELEASE_FEE_BPS = 20` (0.2%). Deducted from released amount in `executePetition()`, transferred to `lazarusPool`.

**Ownership transfer** is two-step: `initiateOwnershipTransfer(addr)` then `acceptOwnership()` from the pending address.

## Key Product Concepts (affect code decisions)

- **Normal transactions are never intercepted.** Lazarus monitors wallet addresses by reading public on-chain data, not by routing transactions. The contract's `recordActivity()` is called by an off-chain indexer watching the owner's address.
- **Confirmers earn nothing from what they confirm.** This is the core anti-fraud mechanism. Any code that touches fund distribution must check `confirmerVotedOnPetition`.
- **Time alone never triggers a release.** `vitalityScore()` returning 0 is not sufficient for `executePetition()` — it still requires petition approval with the full vote + challenge window flow.
- **All frontend state is simulated.** The app runs without a live blockchain connection. Wire up `web3.js` or `ethers.js` to the contract ABI when moving beyond demo.

## Contract Deployment (when ready)

Target chain: **Base Sepolia** (testnet) or **Base mainnet**.
Constructor arg: `_lazarusPool` — the address that receives 0.2% release fees.

```bash
# Quick deploy via Hardhat (scaffold first with: npx hardhat init)
npx hardhat run scripts/deploy.js --network base-sepolia
```

ABI is needed by the frontend to replace simulated state with live contract calls.
