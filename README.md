# Cali Valley Bots — Team Console

An 11-person AI build team (Marcus, Elena, Kai, Levi, Nicole, Sophia, Alexander, Diego, Amara, Isabella, Jonas) that can work on **any app**. Built on GT Team Console v3.2.

Everything lives in one file: **`src/App.jsx`**. It only imports `react`, so you can paste it straight into Claude as an artifact, or run it as a normal website.

## What it does

- **Projects:** create, rename and switch projects. Each one has its own name and app brief, which every worker gets as their product context. Each project also keeps its own threads, inbox, relay log, war room, ledger and archive. Your old GT console data moves into the **GT · Get This** project.
- **Team chat, auto-relay hand-offs, multi-send, inbox and war room:** these work the same as v3.2.
- **Records:** every input from every worker on the project is filed with its time, worker and source. That covers chat replies, multi-send answers, relay hand-offs, war-room takes, chair syntheses and sign-offs, plus your own messages.
  - Filter by worker or source, and search one project or all of them.
  - Export as **Markdown**, **JSON** or **CSV**. The CSV columns match the Notion "Cali Valley Bots — Worker Records" database: Summary, Project, Worker, Source, Handed to, Input, When, Crypto gate (Levi), QA gate (Jonas).
- **Corrections, never deletes:** you can correct any record or ledger entry, and the original is always kept underneath.
- **Backup and restore:** export everything to one file, or restore from a Cali Valley Bots backup, a project JSON or an old GT console backup. Restoring merges the data in and never removes anything.
- **Optional device sync:** set the same private sync code on each device and press **Sync devices**.
  - Your record is encrypted in the browser with that code (AES-GCM) before it's stored in the app's free Cloudflare KV.
  - Sync merges both ways and never deletes.
- **Longer replies:** the default is 4,000 tokens, and you can change it in Settings.

## Where it runs

| | Storage | AI calls |
|---|---|---|
| Inside Claude (artifact) | `window.storage` | Keyless Claude calls, as before |
| Any browser / the live site | `localStorage` | Settings → proxy URL (recommended) or your Anthropic API key, kept on that device only |

Data key: `cali_valley_bots_v1`. The old `gt_console_v3`, `v2` and `v1` keys are read once on first run and are never written to or deleted.

## Develop

```bash
npm install
npm run dev      # local
npm run build    # production build in dist/
```

## Deploy (Cloudflare Workers, free tier)

`scripts/deploy-gen.mjs` embeds `dist/` in a single Worker. The same Worker also serves the sync API at `/api/sync/<id>`, using a KV binding named `SYNC`.

```bash
npm run build
KV_ID=<kv namespace id> node scripts/deploy-gen.mjs
```

Upload `.deploy/worker.js` as a module Worker with the `SYNC` KV binding. Live preview: https://cali-valley-bots.travisleeswift.workers.dev
