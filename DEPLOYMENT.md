# Deployment guide

Get Lazarus live at `lazarusprotocol.xyz` on Vercel in under 30 minutes. Walk through these in order — each step assumes the previous succeeded.

---

## Pre-flight (5 min)

Run these from the project root.

```bash
# 1. Make sure tests pass
npx hardhat test
# Expect: 90 passing

# 2. Verify JS files have no syntax errors
node --check js/app.js
node --check js/contract.js
node --check js/activity.js
node --check js/sol.js
node --check api/ask.js

# 3. Confirm dependencies are listed
cat package.json | grep -A1 '"dependencies"'
# Expect: "@anthropic-ai/sdk"
```

### Generate og.png (one-time)

Social shares need a 1200×630 image at `og.png` in the repo root. Two options:

**Option A — use the built-in generator (recommended):**

1. Open `tools/og-maker.html` in any browser (just double-click the file)
2. Click **Download og.png**
3. Save the downloaded file to the repo root, next to `index.html`

**Option B — use any design tool:**

Create a 1200×630 PNG with the Lazarus branding. Save as `og.png` at the repo root.

If you skip this, social shares will show a broken image. Not a deploy-blocker, but worth doing.

---

## Step 1 — Push your local changes to GitHub (2 min)

```bash
# Add everything that's been built, except VISION.md (already removed from index)
git add .
git status                # quick sanity-check — should NOT show VISION.md

git commit -m "ship: deploy-ready — Vercel config, registry, vault, SOL, multichain, docs"
git push origin main
```

If `git push` asks for credentials and you've used GitHub before, your stored creds should work. If not, set up a [Personal Access Token](https://github.com/settings/tokens) and use it as your password.

---

## Step 2 — Import the project on Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New… → Project**.
3. Find `DEVSOL404/Lazarus-protocol` in the list (or click "Adjust GitHub App Permissions" if it's not visible).
4. Click **Import**.
5. **Framework Preset:** leave as "Other" (Vercel auto-detects).
6. **Build & Output Settings:** leave the defaults — `vercel.json` has all the config we need.
7. **Environment Variables:** add these now (or skip and add later in dashboard):

   | Key | Value | Required? | Purpose |
   |-----|-------|-----------|---------|
   | `ANTHROPIC_API_KEY` | _your key from console.anthropic.com_ | yes (if you want SOL working) | SOL chatbot |
   | `LAZARUS_ETHERSCAN_KEY` | _your key from etherscan.io/apis_ | optional but recommended | Wallet activity panel rate limit (1/5sec without key, 5/sec with) |

8. Click **Deploy**.

Vercel will run `npm install`, deploy the static files, deploy `api/ask.js` as a serverless function, and give you a URL like `lazarus-protocol-xxx.vercel.app`. Open it — the site should load. SOL will work if you set the API key. The contract still won't be deployed (separate step below).

---

## Step 3 — Add your custom domain (5 min)

1. In your Vercel project, go to **Settings → Domains**.
2. Type your domain — `lazarusprotocol.xyz` (the one in your codebase) — and click **Add**.
3. Vercel will show DNS records you need to set. Copy them. Two scenarios:

### If Vercel says "A record `@` → 76.76.21.21" + "CNAME `www` → cname.vercel-dns.com"

This is the recommended path. Add these at Namecheap (Step 4 below).

### If Vercel says "Change nameservers to ns1.vercel-dns.com / ns2.vercel-dns.com"

Use this only if you don't manage other DNS records (email, etc.) on Namecheap. It moves your entire DNS to Vercel.

---

## Step 4 — Configure DNS at Namecheap (5 min)

1. Sign in at [namecheap.com](https://www.namecheap.com).
2. Go to **Domain List → Manage** (next to `lazarusprotocol.xyz`).
3. Click the **Advanced DNS** tab.
4. Delete any default records (the URL Redirect / parking page entries).
5. Add the records Vercel showed you:

   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | A Record | `@` | `76.76.21.21` | Automatic |
   | CNAME Record | `www` | `cname.vercel-dns.com.` (note trailing dot if Namecheap requires it) | Automatic |

6. Save.

Propagation usually takes 5-30 minutes. Vercel will email you when it sees the DNS and finishes provisioning the SSL certificate. The site will live at:
- `https://lazarusprotocol.xyz` (apex)
- `https://www.lazarusprotocol.xyz` (auto-redirects to apex)

---

## Step 5 — Deploy the smart contracts (15 min)

The website is up but the **contract is still not deployed**. Without it, the dashboard runs in simulation mode. To go fully live:

```bash
# 1. Fund the deployer wallet with ~0.05 Base Sepolia ETH
#    Address: 0x31cA16CdB2d51C5D09eF11d06B7Ebb22941C6133
#    Faucets:
#      https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
#      https://faucet.quicknode.com/base/sepolia

# 2. Run the deploy script (deploys both Registry and LazarusProtocol)
npm run deploy:sepolia

# Output will look like:
#   ✓ Registry: 0xRegistry123...
#   ✓ Lazarus:  0xLazarus456...
```

3. Open `js/contract.js` and find the chain `84532` entry. Update **two** fields:

   ```js
   84532: {
     // ...
     address: '0xLazarus456...',           // ← paste your Lazarus contract address
     registryAddress: '0xRegistry123...',  // ← paste your Registry address
     // ...
   },
   ```

4. Commit and push:

   ```bash
   git add js/contract.js
   git commit -m "wire: deployed Lazarus + Registry on Base Sepolia"
   git push
   ```

5. Vercel auto-redeploys on push. Within ~60 seconds the live site is updated and now reads from real contracts.

6. (Optional) Verify on Basescan:

   ```bash
   npx hardhat verify --network baseSepolia <Registry-address>
   npx hardhat verify --network baseSepolia <Lazarus-address> <LAZARUS_POOL> <ETH_USD_FEED>
   ```

   Verified contracts let users read source code on Basescan, which judges and savvy users will check.

---

## Step 6 — Verify everything end-to-end (5 min)

In a fresh browser (or incognito):

1. Visit `https://lazarusprotocol.xyz` — landing page loads, hero animation plays.
2. Click "Open app" — dashboard loads.
3. Topbar should show the chain picker. Switch to **Base Sepolia**.
4. Connect MetaMask (Account 1).
5. Topbar should show `LIVE · ON-CHAIN` and your wallet balance.
6. Settings → Identity → claim a handle (e.g. `@you`). Sign the tx.
7. After confirmation, dashboard greeting should update to "You're covered, @you."
8. Roles → Invite someone — type `@you` (yourself for testing) or another address. Generate the link.
9. Click the **DURESS** button in the topbar — confirmation modal should appear.
10. Open SOL chat (bottom-right pill) — ask "What is Lazarus?" — should get a real answer.

If all 10 work, you've actually shipped.

---

## Troubleshooting

### "SOL says it's not configured"
You forgot to set `ANTHROPIC_API_KEY` in Vercel. Go to **Settings → Environment Variables**, add it, then **Settings → Deployments → Redeploy** the latest deployment (env var changes don't apply to existing deployments).

### "Wallet activity panel says rate-limited"
You don't have `LAZARUS_ETHERSCAN_KEY` set. Get a free key at [etherscan.io/apis](https://etherscan.io/apis), add to Vercel env vars, redeploy. Without it, the panel works but throttles to 1 req / 5sec / IP.

### "Domain still not working after 30 min"
Run `dig lazarusprotocol.xyz` (or `nslookup`) — should return `76.76.21.21`. If it doesn't, the DNS hasn't propagated yet OR you have other records conflicting. Check Namecheap's Advanced DNS for stray entries.

### "MetaMask can't switch to Base Sepolia"
The chain picker tries to add Base Sepolia automatically. If it fails, in MetaMask: **Settings → Networks → Add Network Manually** with:
- Network name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency symbol: ETH
- Block explorer: https://sepolia.basescan.org

### "I see the demo seed data, not real data"
Either the contract isn't deployed yet (see Step 5), or you haven't connected your wallet, or your wallet is on a chain where the contract isn't deployed (only Base Sepolia for now).

### "git push rejected"
Probably because `VISION.md` is in your old commits. The file is now in `.gitignore` and removed from the index, but it's still in git history. To remove from history entirely (destructive):
```bash
git filter-repo --path VISION.md --invert-paths
git push --force
```
Only do this BEFORE inviting other contributors. Force-pushing rewrites history for everyone.

---

## What lives where after deployment

| Surface | URL |
|---------|-----|
| Landing | `https://lazarusprotocol.xyz/` |
| App | `https://lazarusprotocol.xyz/app` |
| Docs | `https://lazarusprotocol.xyz/docs` |
| SOL API | `https://lazarusprotocol.xyz/api/ask` (POST only) |
| Lazarus contract | Basescan link in the dashboard topbar after deploy |
| Registry contract | Same |

---

## Optional: Speed up the SOL chat

By default, every SOL request reads the full system prompt fresh (~3500 tokens). With prompt caching enabled (already configured in `api/ask.js`), Claude reuses the cached prefix on every request after the first — saving ~90% of input tokens and ~50% of latency.

To verify it's working, after a few SOL chats check the Vercel function logs:
```
{
  "input_tokens": 12,
  "cache_read_input_tokens": 3421,    ← should be > 0 from second request onward
  "cache_creation_input_tokens": 0
}
```

If `cache_read_input_tokens` stays 0, the system prompt is being invalidated somehow — file an issue and I'll dig in.
