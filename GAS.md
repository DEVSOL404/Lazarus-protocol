# Gas benchmarks

Measured against `LazarusProtocol`, `LazarusRegistry`, and `LazarusVault` on a local Hardhat fork. Numbers are deterministic — re-run with `npx hardhat run scripts/gas-benchmark.js` to verify.

These numbers matter because Lazarus is meant to be cheap enough for ordinary users, not just whales. A user shouldn't have to spend $10 to set up monitoring.

---

## Raw gas usage

Measured 2026-04, contracts unchanged from `commit:HEAD`.

| Operation | Gas used | Frequency |
|---|---:|---|
| **One-time setup** | | |
| LazarusProtocol deploy | 5,340,939 | Once per user |
| LazarusRegistry deploy | 756,872 | Once per chain (singleton) |
| **Identity** | | |
| `claimHandle` (3-char name) | 71,833 | Once per user |
| **Role management** | | |
| `grantRole` (1st) | 115,743 | Once per role-holder |
| `grantRole` (subsequent) | 101,081 | (slightly cheaper, warm storage) |
| `inviteRole` (targeted) | 234,765 | Once per invite |
| **Daily / weekly operations** | | |
| `recordActivity` (heartbeat) | 34,936 | Daily-ish |
| `setSilenceWindow` | 138,232 | Per trip / leave |
| `clearSilenceWindow` | 34,618 | Per trip / leave |
| **Petition flow (rare, only when needed)** | | |
| `filePetition` (MEDICAL, 1 ETH) | 377,881 | Per emergency |
| `commitVote` | 109,631 | Per Confirmer per petition |
| `revealVote` (1st) | 105,575 | Per Confirmer per petition |
| `revealVote` (2nd) | 64,877 | (subsequent reveals warm cheaper) |
| `executePetition` | 169,191 | Per emergency |
| **Duress protocol (extremely rare)** | | |
| `recordActivityUnderDuress` | 80,298 | If needed |
| `watcherClearDuress` (1st) | 71,201 | If needed |
| `watcherClearDuress` (2nd, lifts) | 61,561 | If needed |

---

## What this costs in dollars

Base L2 gas prices fluctuate, but typical ranges as of recent months:

| Network | Gas price | ETH/USD assumed |
|---|---|---|
| Base Sepolia | ~0.001 gwei | testnet (free) |
| Base mainnet | ~0.005-0.05 gwei | $3,000-$4,000 |
| Optimism mainnet | ~0.001-0.01 gwei | same |
| Ethereum L1 (worst case) | 5-30 gwei | same |

Conservative estimate at **Base mainnet, 0.02 gwei, ETH ~$3,500**:

| Operation | Approx cost |
|---|---|
| Initial protocol deployment | **$0.37** |
| Registry deployment (already done by protocol — users don't pay) | $0.05 |
| Claim a handle | $0.005 |
| Grant a role | $0.008 |
| Daily heartbeat | **$0.0024** |
| Setting up Silence Window for a trip | $0.01 |
| **Filing an emergency petition** (rare) | $0.026 |
| **Confirmer commit + reveal** | $0.015 |
| **Executing an approved petition** | $0.012 |

**Bottom line:** even on Base mainnet, an ordinary user pays well under $1 for a year of Lazarus monitoring under realistic usage (~365 heartbeats + occasional state changes).

The costliest operation is the initial deploy (~$0.37). Everything else is nominal.

> Lazarus does not charge a subscription. The release fee (0.20-0.40%, capped at $2,500 for the death-confirmed path) is the only protocol-side cost — and only on a release event itself, not on monitoring. See `docs.html` for the user-facing fee breakdown.

---

## What we optimized

Recent changes that meaningfully moved gas usage down:

- **`openPetitionCount` counter** — `engageNoReleaseFreeze` and `protocolSummary` were O(n) over all petitions ever filed; now O(1).
- **`_releaseHistoryHead` pointer** — `_aggregateSpend()` was O(n) over lifetime release records; now bounded by ~90 days of activity.
- **`openInviteCount` counter** — `openInvitations()` view was a two-pass scan; now single-pass.
- **`activeConfirmers/Custodians/Watchers`** — still O(role-list-length), bounded by realistic role counts (typically <10 per category).

---

## Reproducing these numbers

```bash
npm install
npx hardhat run scripts/gas-benchmark.js
```

The script:
1. Deploys both contracts with default constructor args
2. Walks the full happy path: handle claim → role grants → fund → file petition → commit-reveal → challenge → execute
3. Walks the duress path: signal → 2x watcher clear
4. Prints a Markdown table of `gasUsed` per call

If you make changes to the contract that move gas more than 5%, update this file.

---

## L1 cost reference (avoid)

If you deployed Lazarus on Ethereum mainnet at **20 gwei, ETH ~$3,500**:

| Operation | L1 cost | Verdict |
|---|---|---|
| Initial deploy | **~$370** | Punishing |
| Daily heartbeat | $2.45 | $900/year for monitoring alone |
| Filing a petition | $26 | One-shot, fine |
| Full execute path | $12 | One-shot, fine |

This is why Lazarus is L2-first. L1 deployment is supported by `hardhat.config.js` but discouraged outside of high-value institutional users.
