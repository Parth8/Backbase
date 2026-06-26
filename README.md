# Meridian Bank · Grand Central Payments Connector — Case Study

A Forward Deployed Product Manager case study, presented as an interactive deck.

**The problem:** a banking payments connector (SCT, SCT Inst, SWIFT), four weeks
from go-live, returns failure responses its client's ops team cannot read. What
looks like a connector defect turns out to be a failure-response contract that
never evolved while the request side did — the same gap surfacing across three
bank implementations because patches live in each bank's fork and never reach the
platform baseline.

The deck walks the diagnosis, the data, the systemic signal, the stakeholder
management, and the go-live-vs-platform decision.

---

## Running it

It's a static site. Open `index.html` in any modern browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

### Presenting
- **Arrow keys / Space** — next / previous
- **← →** — navigate
- **1–6** — jump to an act
- **Home / End** — first / last slide
- Click any node on the bottom rail to jump to that act

The deck is keyboard-driven and built for live presenting. It respects
`prefers-reduced-motion`.

---

## Deploying to GitHub Pages

This repo is structured to serve from the root. In the repo settings, set
**Pages → Build and deployment → Source: Deploy from a branch**, branch `main`,
folder `/ (root)`. The deck will be live at
`https://<username>.github.io/<repo>/`.

---

## Structure

```
.
├── index.html                 # the presentation (30 slides, 6 acts)
├── assets/
│   ├── css/
│   │   └── styles.css          # design system + motion
│   └── js/
│       ├── presentation.js     # navigation, rail progress, keyboard
│       └── animations.js       # per-slide reveals (clustering, SVG draw, counters)
└── resources/                  # the real artifacts, linked from the deck
    ├── gc-payments-connector-v1.0.yaml      # OpenAPI — Apex era, SCT only
    ├── gc-payments-connector-v1.5.yaml      # OpenAPI — Sparkasse era, + SCT Inst
    ├── gc-payments-connector-v2.0.yaml      # OpenAPI — Meridian era, + SWIFT
    ├── meridian_uat_cycle3_transactions.csv # 500 synthetic UAT transactions
    ├── meridian_uat_cycle3_connector_logs.csv # 301 connector log lines
    └── gc_error_mapping_config_v2.json      # 134-entry error mapping config
```

---

## The artifacts

Everything in `resources/` is real and self-consistent — the deck links to it
directly so it can be inspected.

- **Three OpenAPI specs** show the contract evolving across versions. The request
  side grows from ~7 fields to 20+ to absorb each new rail; the failure response
  barely changes. That asymmetry is the case.
- **The transaction dataset** (500 rows, 47 failures) carries full request and
  response payloads. The 47 failures cluster — invisibly on the surface, clearly
  when pivoted by failure category — onto four structural gaps.
- **The connector logs** (301 lines) contain the smoking guns: an unhandled
  `ConnectException`, and `No translation mapping found for T24 code … passing
  through raw.`
- **The error mapping config** (134 entries across SEPA, SWIFT, T24, and
  connector-generated codes) is the go-live fix made concrete: the canonical
  envelope is the platform contract; the core-error mapping is bank-owned config.

---

## Design

Warm Italian-studio editorial, not a dashboard. Bricolage Grotesque + Newsreader
+ Spline Sans Mono on warm plaster, a pine-green hero with rust reserved for
failure states, and a payment-trace rail along the bottom as the wayfinding
signature — a transaction's journey through core → connector → rail is, literally,
the subject.
