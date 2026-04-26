# ElevenLabs narration setup

This guide swaps the demo's browser-TTS narration for pre-rendered ElevenLabs MP3s. The voice goes from "ass" to "actually cinematic" in about 5 minutes.

You only need an API key. Free tier is enough — our entire 90-second narration is ~900 characters, and the free monthly cap is 10,000.

---

## TL;DR (for the impatient)

```bash
# 1. Sign up at https://elevenlabs.io
# 2. Profile → API Keys → Create new key → copy
# 3. Open .env in this repo, paste:
echo 'ELEVENLABS_API_KEY=sk_your_key_here' >> .env

# 4. Render the MP3s
npm run narration

# 5. Open demo.html — it auto-detects and plays them.
```

That's it. The demo will now use the ElevenLabs voice, which sounds infinitely better than browser TTS.

---

## Step 1 — Get an API key (2 minutes)

1. Go to **https://elevenlabs.io** and sign up (free tier is fine — no credit card).
2. After login, click your avatar (top-right) → **Profile** → **API Keys**.
3. Click **Create new API key**, give it a name like "Lazarus", scope it to **Text to Speech only**.
4. Copy the key. It starts with `sk_…`.

> ⚠️ Treat this key like a password. Never commit it. The `.env` file is already in `.gitignore`.

---

## Step 2 — Pick a voice (optional)

The default voice is **Adam** — warm, deep, classic narrator. If that's not your taste, you can override with any voice ID from your ElevenLabs library.

**Best voices for cinematic / Morgan-Freeman-style narration:**

| Voice | ID | Vibe |
|---|---|---|
| **Adam** (default) | `pNInz6obpgDQGcFmaJgB` | Warm, deep, classic narrator |
| **Bill** | `pqHfZKP75CvOlQylNhV4` | Older, gravitas, closest to Morgan-Freeman tone |
| **Brian** | `nPczCjzI2devNBz1zQrb` | Calm, mature American |
| **George** | `JBFqnCBsd6RMkjVDRZzb` | Warm British, narrator-perfect |
| **Daniel** | `onwK4e9ZLuTAKqWW03F` | Deep British |
| **Drew** | `29vD33N1CtxCmqQRPOHJ` | Mature American |
| **Arnold** | `VR6AewLTigWG4xSOukaG` | Crisp, authoritative |

To preview them: open the ElevenLabs Voice Library (https://elevenlabs.io/app/voice-library), find a voice, click ▶ to hear it read a sample.

To override the default, add to `.env`:

```
ELEVENLABS_VOICE_ID=pqHfZKP75CvOlQylNhV4
```

(That's Bill — the most Morgan-Freeman-like option in the default library.)

---

## Step 3 — Set the key

Open `.env` in the project root (create it if missing — `.env.example` is the template). Add:

```
ELEVENLABS_API_KEY=sk_your_actual_key_here
ELEVENLABS_VOICE_ID=pqHfZKP75CvOlQylNhV4   # optional, defaults to Adam
```

Save the file.

---

## Step 4 — Render the audio

From the project root:

```bash
npm run narration
```

You'll see something like:

```
🎙  Rendering 18 narration lines
    voice=pqHfZKP75CvOlQylNhV4   model=eleven_multilingual_v2

  → s1-t1200.mp3  rendering "Every year… billions in crypto. Lost. Forever."  (24.3 KB)
  → s2-t400.mp3   rendering "Lost keys. Owners… gone silent. Families. Lock…"  (31.8 KB)
  ...
  ✓ s8-t4600.mp3  (28.1 KB)

✅  18 rendered, 0 cached
    manifest → audio/narration/manifest.json

   Open demo.html — it will auto-detect the manifest and use these.
```

The MP3s land in `audio/narration/`. Total size is ~400-700 KB.

> 💸 **Cost:** zero on the free tier. Each render uses ~900 characters of your monthly quota; the free tier gives 10,000 chars/month, so you can re-render ~10 times. After that, the script caches and re-renders only changed lines.

---

## Step 5 — Open the demo

```bash
start demo.html       # Windows
open demo.html        # Mac
```

Click **Play with narration**. The page detects `audio/narration/manifest.json` on boot and routes narration to the MP3s instead of browser TTS. The voice picker in the controls now shows "ElevenLabs · pre-rendered" (it's locked because there's nothing to pick — the audio is baked in).

---

## Tuning the voice

If the default delivery isn't dramatic enough, you can adjust three settings in `tools/render-narration.js`:

```js
const VOICE_SETTINGS = {
  stability:        0.42,   // lower = more emotion / variation
  similarity_boost: 0.78,   // higher = more like the source voice
  style:            0.35,   // higher = more dramatic / stylized delivery
  use_speaker_boost: true,
};
```

After changing, re-run:

```bash
FORCE=1 npm run narration       # force re-render of all 18 lines
```

(The script normally caches and skips unchanged lines. `FORCE=1` overrides.)

---

## Common adjustments

**"Voice sounds robotic / monotone."** Lower `stability` to 0.30 and raise `style` to 0.5. More expressive, but less consistent.

**"Voice sounds drunk / unstable."** Raise `stability` to 0.60. More predictable, less variation.

**"Pacing is too fast."** ElevenLabs is harder to slow down without third-party tools. Best path: edit `NARRATION` in `tools/render-narration.js` to add more `…` and `.` for natural pauses. Re-render.

**"I changed a narration line and the voice didn't update."** The cache is keyed on text content. Just re-running `npm run narration` re-renders only the lines that changed — should "just work."

**"I want different voices for different scenes."** Currently the script uses one voice for everything. To do per-scene voices, edit `render-narration.js` — each `NARRATION` entry can have a per-line `voiceId` field. Want me to add this? File an issue or change.

---

## Removing the audio (revert to Web Speech)

If you want to ship just the Web-Speech version:

```bash
rm -rf audio/narration
```

The manifest is gone, so demo.html falls back to Web Speech automatically.

---

## Should I commit the MP3s to git?

**Yes.** They total under 1 MB, and committing them means:
- The deployed Vercel build ships the audio with the page — no setup for your judges
- Anyone who clones the repo gets the demo working out of the box
- The repo is self-contained — no API key required to play the demo

The current `.gitignore` allows `audio/narration/*.mp3` through. The only thing it ignores is `.env`, which is correct.

---

## What about cost on a paid plan?

If you blow through the free 10K char/month tier:

| Plan | $/month | Chars/month | Re-renders of demo |
|---|---|---|---|
| Free | $0 | 10,000 | ~10 |
| Starter | $5 | 30,000 | ~33 |
| Creator | $22 | 100,000 | ~110 |

For a hackathon, free tier covers everything. You can rerun the script ~10 times before hitting the wall, which is far more iteration than you need.

---

## Troubleshooting

**`ELEVENLABS_API_KEY is not set`** — your `.env` doesn't have the key, or the file is in the wrong location. It must live in the project root, next to `package.json`.

**`ElevenLabs 401: invalid_api_key`** — the key is wrong or revoked. Generate a new one in your ElevenLabs profile.

**`ElevenLabs 429: rate_limit_exceeded`** — you've hit the free tier cap or are running multiple scripts in parallel. Wait a minute and re-run; the cache will skip what's already done.

**Demo still uses Web Speech after rendering** — confirm `audio/narration/manifest.json` exists. Open browser devtools console: you should see `[demo] ElevenLabs narration loaded — 18 tracks`. If not, the fetch failed (check Network tab — likely a path / Vercel deploy issue).
