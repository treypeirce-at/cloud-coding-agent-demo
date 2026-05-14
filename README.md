# Pulse

> Product analytics that actually move the needle.

**Pulse is a demo SaaS app.** It's a static-only analytics dashboard built to serve as a target for a cloud coding agent. The agent reads customer feedback in Airtable, decides what to build, opens a GitHub issue here, writes a PR, and watches it ship.

## What's in here

```
.
├── index.html        Dashboard page — KPI cards, DAU chart, daily metrics table
├── settings.html     Settings page — profile, workspace, notifications, billing, integrations
└── assets/
    ├── app.js        Table + chart interactivity
    ├── data.js       Mock data (15 days of fabricated metrics)
    └── styles.css    Custom styles (most styling is Tailwind via CDN)
```

No build step. No backend. Just HTML, CSS, and JavaScript. Tailwind and Chart.js are loaded via CDN.

## Run it locally

Open `index.html` in a browser. That's it.

## Live demo

This repo is published via GitHub Pages from the `main` branch root.

→ **https://treypeirce-at.github.io/cloud-coding-agent-demo/**

## Demo context

Pulse pairs with a Cloud Coding Agent Demo Airtable base that holds:

- **Customer Feedback** — raw signals from customers
- **Product Ideas** — PM-curated backlog, linked to the feedback that motivated each idea
- **Agent Activity** — the coding agent's worklog as it picks up Approved ideas and ships them

The first Product Idea queued for the agent is **"One-click CSV Export for Dashboards"** — addressing customer asks from Acme Corp, Globex, and Hooli. Pulse currently has per-row export buttons; the agent's job is to add a bulk "Download all as CSV" button at the top of the metrics table.

## Disclaimer

Pulse is not a real product. All metrics, customer names, and copy are fabricated.
