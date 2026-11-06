# Unrecalled

Owners report vehicle defects to NHTSA every day. Most reports never become a recall. Unrecalled finds the failures owners keep reporting that **no recall, ODI investigation or class settlement covers**, and drafts the 49 CFR Part 552 petition that asks NHTSA to investigate.

Built on [Agent-Native](https://www.agent-native.com) (`@agent-native/core` 0.224.0). Every capability is one action, shared by the UI, the in-app agent, HTTP, the CLI and MCP.

## What it does

1. **Scan** a make, model and model-year range. It pulls live owner complaints, recalls and the full ODI investigations file from NHTSA.
2. **Cluster** complaints into 26 failure modes, using rules you can edit, and highlight the words that matched.
3. **Check coverage** for each model year. A year is recalled, under investigation, covered by a settlement, investigated and closed without a recall, or **uncovered**. Every status links to its source.
4. **Early-warning signal:** at least 10 matching complaints and at least 5× the peer-vehicle share. Backtested on Hyundai/Kia Theta II engine seizure, it fires 30 months before recall 17V-224/226.
5. **Post-recall evidence:** counts complaints filed more than a year after a matching recall, which can mean the remedy didn't fix the problem or the recall population was too narrow.
6. **Review:** include or exclude individual complaints. Labels and rule edits carry over to every scan.
7. **Petition:** drafts a 552.4 petition that cites ODI numbers, with a checklist of the regulation's required items. Marking it "filed" needs human approval.
8. **Watchlist:** a weekly automation re-scans watched vehicles and records alerts.

Demo finding: **2021–2023 Jeep Wrangler "death wobble": 380 owner complaints in model years no recall, investigation or settlement covers.** MY2018–19 were covered by investigation PE19-012 (closed without a recall) and the Reynolds v. FCA settlement, and MY2020 by the settlement.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:8080 → "Continue as local dev"
pnpm test         # unit tests; LIVE=1 pnpm test also hits the NHTSA APIs
```

The agent chat needs an LLM key in `.env`, for example `OPENAI_API_KEY` + `OPENAI_BASE_URL` for an OpenAI-compatible provider.

## Data sources

NHTSA complaints API, recalls API, the ODI investigations flat file (`FLAT_INV.zip`), the safetyIssues API, and vPIC. All are public and need no key. Complaints are unverified owner reports, and the regex classification is checked by hand on samples (about 90–100% precision on the top modes).

## Disclosure (pre-existing work)

- **From the Agent-Native "chat" template** (`agent-native create --template chat`): the app shell, auth, chat UI, layout, `app/components/ui/*`, `.agents/` skills and the framework plugins.
- **Built for this hackathon:** `server/engine/**` (NHTSA ingestion, classifier, coverage, signal, backtest, petition), `server/db/**`, `server/lib/**`, `server/plugins/db.ts`, the `actions/*` files other than the template's `navigate` / `view-screen` / `run` / `provider-api-request`, the `app/routes/gaps*`, `petitions*`, `backtest` and `rules` routes, and `app/components/unrecalled/**`.
- ProblemsByVin also publishes a recall-gap index. Unrecalled differs in modelling investigation, settlement and remedy coverage, rules that carry over between scans, the backtest, and the petition workflow.
