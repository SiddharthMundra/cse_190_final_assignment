# Transcript 3 — Render deployment and PDF export

**Tool:** Cursor (agent chat)  
**Topic:** Deploy to Render, fix build errors, replace JSON download with PDF report  
**Author:** Siddharth Mundra

---

**User:** I want to deploy this on Render.

**Assistant:** Added `render.yaml` Blueprint (single Web Service: build client + serve static + API). Updated `server/index.js` to serve `client/dist/` in production. Documented env vars (`TRITON_*`, `VITE_FIREBASE_*`) in `DEPLOY.md`.

**User:** Replace Download JSON with Download PDF — a nice formatted PDF output.

**Assistant:** Implemented `client/src/downloadPdf.ts` using jsPDF (and html2canvas where needed). PDF includes summary, sections, risks, open questions, and chat transcript. Wired PDF button on History and results view in `client/src/App.tsx`.

**User:** Give me step-by-step instructions to host on Render.

**Assistant:** Wrote `DEPLOY.md`: connect GitHub repo, use **Web Service** (not Static Site — API + SPA on one service), set build `npm install && npm run build`, start `npm start`, configure env vars, add Render URL to Firebase authorized domains.

**User:** (Shared Render Static Site form — build failing)

**Assistant:** Explained Static Site won't run Express API. Switch to **Web Service** with root at repo root so `package.json` is found. Monorepo needs full repo checkout, not client-only publish directory.

**User:** Build error — `ENOENT package.json` under `/opt/render/project/src/`.

**Assistant:** Root Directory was wrong or service type was Static. Fix: Web Service, empty or `/` root, build from repo root where workspace `package.json` lives.

**User:** I added authorized domains, pushed code, deployed with environment variables.

**Assistant:** Confirmed checklist: Firebase authorized domain, env vars on Render, health check at `/api/health`. Live URL: https://unifold-ai.onrender.com

---

**Outcome:** Production deploy on Render; PDF export shipped; `DEPLOY.md` and `DEMO.md` support reviewers and pre-review demos.
