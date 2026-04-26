# Lazarus Protocol — Threat Model

This document is the security thinking behind the contracts. It is structured as STRIDE (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege), and every threat is mapped to where it is mitigated in the code (or explicitly accepted as out-of-scope for this version).

The protocol's job is to escrow a portion of someone's crypto and orchestrate an orderly response when they go silent. The threat model is correspondingly weighted toward fund-loss attacks, social-engineering attacks, and coercion attacks — the kinds of failures that map to "wrong people get the money" or "right people can't get the money when needed."

---

## 1. Adversary catalogue

| Adversary | Capability | Goal |
|---|---|---|
| **Outside attacker** | Reads chain, can transact from any address they fund | Drain protocol funds without holding any role |
| **Compromised Confirmer** | Holds Confirmer role, has the key | Vote to release funds to a colluding Custodian, share the proceeds off-chain |
| **Compromised Custodian** | Holds Custodian role, has the key | File a fake petition to release funds to themselves |
| **Compromised Watcher** | Holds Watcher role, has the key | Block legitimate releases (denial of service) or fail to clear duress when needed |
| **Coercer with owner key** | Holds the owner's private key under coercion (kidnap, gun-to-head, court order) | Drain or freeze funds while pretending to act as the owner |
| **Inactive owner** | The actual user; goes silent for legitimate (or terminal) reasons | N/A — owner is not adversary, but their absence is the trigger |
| **Stale or wrong oracle** | Chainlink ETH/USD feed reports incorrect or outdated values | Mis-cap the death-trigger fee, either drastically over- or under-charging |
| **Reorgs / front-runners** | Standard L2 mempool risk | Manipulate vote ordering, snipe execute calls |

---

## 2. STRIDE matrix

### 2.1 Spoofing

| Threat | Mitigation | Where |
|---|---|---|
| Attacker calls `recordActivity()` to fake a heartbeat | Only the owner or an authorized relayer can call | `Lazarus.sol:286` (`require(msg.sender == owner \|\| isActivityRelayer[msg.sender])`) |
| Attacker calls `acceptInvite(id)` to claim a role intended for someone else | Targeted invites bind to the specific invitee address; open invites are first-come | `acceptInvite` line 530 — `require(msg.sender == inv.invitee)` for targeted; open invites get the first claimant |
| Attacker pretends to be the owner during ownership transfer | Two-step transfer: owner initiates, new owner must explicitly accept | `initiateOwnershipTransfer` + `acceptOwnership` |

### 2.2 Tampering

| Threat | Mitigation | Where |
|---|---|---|
| Confirmer changes their vote after seeing other votes | Commit-reveal with `keccak256(approve, salt)`. Reveal must match commit. | `commitVote` + `revealVote`. Salt is unique per voter; reveals after commit window expires. |
| Petition's eligible-Confirmer set is mutated mid-vote | Snapshot of `activeConfirmers()` is taken at filing and stored in `p.eligibleConfirmers`. Subsequent role changes do not affect this petition. | `filePetition` line 675 |
| Owner's heartbeat manipulation under duress | Duress flag `duressActive` flips when `recordActivityUnderDuress` is called; can only be cleared by 2 watcher co-signs | `watcherClearDuress` lines 380-397 |
| Project Instructions changed silently to redirect funds | Timelock applies if `protectionScore() < 50` — 7-day delay before applying. Score is the alarm; timelock is the brake. | `setInstruction` lines 924-951 |

### 2.3 Repudiation

| Threat | Mitigation | Where |
|---|---|---|
| Confirmer claims they didn't vote | `confirmerVotedOnPetition[id][addr]` is set on commit, not just reveal — non-repudiable on-chain record | `commitVote` line 729 |
| Custodian claims they didn't file a petition | All petitions emit `PetitionFiled` with `requester` address, indexed | `PetitionFiled` event line 228 |
| Owner claims they didn't engage `NoReleaseFreeze` | Event-emitted, one-way, on-chain forever | `engageNoReleaseFreeze` line 972 |

### 2.4 Information disclosure

| Threat | Mitigation | Notes |
|---|---|---|
| Confirmer's vote is visible before reveal | Only `commitmentHash` is on-chain during commit window; vote bool is in the salt-commit | Standard commit-reveal |
| Project Instructions content visible to anyone | Designed to be IPFS-hashed; `isPrivate` flag indicates encrypted off-chain content | The contract stores the hash; encryption is owner's responsibility |
| Wallet identity visible to all | This is a public ledger — by design. The `LazarusRegistry` lets users opt-in to a handle for cleaner UX. | Acceptable. |
| **Acknowledged residual risk:** All petition amounts, types, and votes are on-chain plaintext. A petition titled "Medical emergency · 0.4 ETH filed by X" reveals personal context. For v1, we accept this — privacy-preserving petitions (zk-proofs of statement validity) are roadmap. | — | — |

### 2.5 Denial of service

| Threat | Mitigation | Where |
|---|---|---|
| Custodian files many petitions to grow `releaseHistory` and grief gas costs of `_aggregateSpend` | Head-pointer lazy-pruning: `_releaseHistoryHead` advances on every `executePetition`, so iteration is bounded by ~90 days of activity | `_pruneReleaseHistory` + `_aggregateSpend` |
| Iterating all petitions on `engageNoReleaseFreeze` becomes prohibitively expensive | Replaced O(n) loop with `openPetitionCount` counter, maintained on every transition | `_noOpenPetitions` (now O(1)) |
| Iterating all invitations on every `openInvitations()` view call | `openInviteCount` + early-exit single pass | `openInvitations` line 599 |
| Watcher refuses to vote on duress clear | Two watchers needed — odd-numbered watcher set sized 3+ tolerates one bad actor | Operational mitigation, not contract |
| Custodian refuses to call `executePetition` after approval | After `FALLBACK_EXECUTION_DELAY` (14 days), any other Custodian can execute | `executePetition` line 856 |
| Reentrancy on fund release | `nonReentrant` modifier on `executePetition` and `withdraw` | line 264 |
| ETH send returns false (revert receiver) | `_send` reverts with explicit message; petition stays unreleased; caller can retry | `_send` line 641 |
| Aggregate cap exhausted by tiny petitions filling the 25% / 90-day window | Per-type cap (15-40%) + 25% aggregate over 90 days. An attacker Custodian can starve future legitimate petitions, but cannot drain. Owner can revoke the Custodian's role at any time. | Caps in `filePetition` |

### 2.6 Elevation of privilege

| Threat | Mitigation | Where |
|---|---|---|
| Confirmer becomes Custodian and earns from a petition they voted on | Confirmers cannot mutate to a different role without an owner-driven `revokeRole` first. Even after revoke + re-grant as Custodian, the `confirmerVotedOnPetition[id][addr]` flag persists per-petition forever, so the (now-)Custodian still cannot receive funds from any petition they voted on as a Confirmer. | `_applyRole` line 567 + `executePetition` line 862 |
| Owner accidentally grants someone two roles | Single-active-role invariant — `_applyRole` reverts on second grant unless previous role is explicitly revoked | line 572 |
| Activity relayer becomes adversarial | Only logs activity; cannot release funds, cannot grant roles, cannot file petitions. Worst it can do is fake a heartbeat (see Spoofing) — owner removes it via `setActivityRelayer(addr, false)` | line 292 |
| `lazarusPool` rotated to attacker's address | Only `LazarusVault.setLazarusPool` allows rotation, and only by the vault owner. The main `LazarusProtocol` does not allow pool rotation in this version. | `LazarusVault.sol:162` |

---

## 3. Coercion attacks (separate threat class)

The owner's private key is *not* the same as the owner's free will. Standard recovery contracts trust whoever signs to be the legitimate owner. Lazarus must work even when this assumption breaks.

### 3.1 Kidnap-and-extort

**Scenario.** An attacker holds a gun to the owner's head and demands they cancel any pending rescue petition. Owner has the key; standard contract logic says the cancel succeeds.

**Mitigation.** Two-tier cancellation gate:

1. During `CommitPhase` only and with no duress flag: owner alone can cancel (the standard "I changed my mind" resurrection path).
2. After commit phase OR while duress is active: owner cancellation requires 2 Watcher co-signatures via `watcherApproveCancel(id)`.

A coercer with only the owner's key cannot kill a legitimate petition past the commit window — they would need to also compromise 2 Watchers off-chain.

**Code:** `cancelPetition` lines 813-832 + `watcherApproveCancel` line 402.

### 3.2 The duress signal itself

**Scenario.** Owner is being coerced to sign a heartbeat. Wants to flip the duress flag without the coercer noticing.

**Mitigation.** `recordActivityUnderDuress(salt)` emits an `ActivityRecorded` event identical to `recordActivity()` from the coercer's perspective — they see a "successful heartbeat" tx land. The internal state change (`duressActive = true`) is silent at the event level except for a separate `DuressSignaled` event that Watcher indexers watch for. The `salt` parameter exists solely to make the calldata fingerprint distinct from a normal heartbeat.

**Code:** `recordActivityUnderDuress` lines 366-377.

### 3.3 Lifting the duress flag

**Scenario.** Owner is safe again. How is the flag cleared without the coercer hijacking the clear?

**Mitigation.** Only Watchers can clear, and 2 of them must co-sign. The owner cannot self-clear — otherwise the coercer would force the owner to clear it.

**Code:** `watcherClearDuress` lines 380-397.

### 3.4 Acknowledged limit

If the attacker compromises 2+ Watcher addresses in addition to the owner key, this defense fails. The mitigation is operational: choose Watchers with maximally-divergent threat surfaces (different geography, hardware, social circle). Cannot be enforced on-chain.

---

## 4. Oracle attacks

### 4.1 Stale or wrong ETH/USD price feed

**Scenario.** Chainlink reports a wildly wrong price (or no price). The death-trigger fee cap (FINAL_TRANSITION_FEE_CAP_USD_CENTS = $2,500) is computed in wei from this price.

**Mitigation.** `_capToWei` checks three things:
- `answer > 0`
- `updatedAt > 0`
- `block.timestamp - updatedAt <= ORACLE_MAX_AGE` (1 day)

If any fail, returns `0` — which triggers the calling `_computeFee` to skip the cap and apply the flat 0.20% fee instead. The fallback is intentionally conservative: a protocol that over-charges by a few basis points is better than one that under- or over-charges by orders of magnitude.

**Code:** `_capToWei` lines 902-918.

### 4.2 Oracle ABI mismatch

The interface uses `latestRoundData()` (returns 5 values) instead of the deprecated `latestAnswer()`. This is the Chainlink-recommended path for staleness detection.

**Code:** `IPriceFeed` line 37.

---

## 5. Economic attacks

### 5.1 Fee theft

**Scenario.** A Custodian executes a petition and receives funds; the protocol skim (0.20-0.40%) is supposed to go to `lazarusPool`.

**Mitigation.** `executePetition` always sends `fee` to `lazarusPool` first, then `net` to the executing Custodian. Both are forced via internal `_send` which reverts on failure. The pool address is set at construction and only the `LazarusVault` (not the main contract) allows rotation, and only by the vault owner.

**Code:** `executePetition` lines 872-873.

### 5.2 Petition gas-grief loop

**Scenario.** A malicious Custodian repeatedly files tiny petitions to inflate `releaseHistory` and slow down future calls.

**Mitigation.** `releaseHistory` only grows on **successful execute** (not on file). To execute, a petition must pass the full commit-reveal-challenge flow with 2+ Confirmer approvals. The cost of forcing one growth event is ~96 hours of contract time + 2 Confirmer co-signatures, which is uneconomic for the attacker. In addition, head-pointer pruning means iteration is bounded by 90 days regardless of cumulative size.

### 5.3 Front-running petition execution

**Scenario.** Two Custodians race to execute an approved petition. Whoever lands first gets the funds.

**Mitigation.** During the first 14 days after the challenge window closes, **only the original requester** can execute (`FALLBACK_EXECUTION_DELAY`). After that, any non-voting Custodian can. This avoids requester-rug while preventing eternal lock-up if the requester goes silent themselves.

**Code:** `executePetition` lines 856-861.

---

## 6. Out of scope for v1 (acknowledged)

These are real risks that are not addressed in this version. They are documented here so readers know we know:

| Risk | Why deferred | Plan |
|---|---|---|
| **Privacy of petition metadata.** Amounts, types, IPFS hash are public. A petition can leak personal context (medical, legal). | zk-proofs of statement validity require substantial cryptographic infra. | Roadmap: zk-petition layer for sensitive types. |
| **Off-chain content integrity.** IPFS pin can disappear; the on-chain `contentHash` proves what was committed but not where to fetch it. | Pinning service is operational, not contractual. | Pin via Filecoin or use Arweave for permanence. |
| **Cross-chain coverage.** Each chain runs its own per-user contract. A user with assets on multiple chains has multiple contracts. | Cross-chain messaging adds attack surface and complexity. | LayerZero / Hyperlane integration is post-MVP. |
| **Mobile-companion heartbeat.** Currently only on-chain activity + manual button counts. | Out of contract scope. | App + push notifications planned. |
| **Audit.** No formal audit. Tests cover invariants and the duress protocol; that is not a substitute. | Audit was out of hackathon scope. | Audit before mainnet, before any non-testnet TVL. |

---

## 7. Pre-deployment checklist

Before sending real funds to a deployed contract, the following must be true:

- [ ] Contract is deployed on a chain where you can verify the source on the block explorer
- [ ] Constructor args (`_lazarusPool`, `_ethUsdFeed`) point to known-correct addresses
- [ ] At least 2 Confirmers + 1 Custodian + 2 Watchers granted before any funds are deposited
- [ ] Watchers are operationally diverse (different geography, hardware, circles)
- [ ] Owner has a back-up plan for losing their key (recovery wallets, hardware wallet seed split)
- [ ] You have tested `recordActivity()`, `setSilenceWindow`, and `cancelPetition` from the actual production wallet at least once
- [ ] You understand `engageNoReleaseFreeze` is **one-way**

This document is alive. If you find a threat we missed, file an issue with `[security]` in the title.
