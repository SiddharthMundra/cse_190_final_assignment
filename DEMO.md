
## Live website 

**URL:** https://unifold-ai.onrender.com

1. Open the URL and sign in with Google.
2. Upload a PDF or `.txt` contract from **Homescreen** — wait for analysis and try **Ask about this document** (chat).
3. Upload a second document, then open **Compare**, pick both saved runs, and run a comparison (optional focus, e.g. "pets").
4. Open **History** to search/sort saved runs or delete one.

## Build from source (Linux / WSL)

From the repository root:

```bash
npm install
cp client/.env.example client/.env   # fill VITE_FIREBASE_* from Firebase console
# create .env with TRITON_* and optionally FIREBASE_PROJECT_ID + FIREBASE_SERVICE_ACCOUNT_JSON
npm run dev
```

Open http://localhost:5173. API is proxied to port 8787.

Production build + single-process serve:

```bash
npm run build
NODE_ENV=production npm start
```

## Demo video

**YouTube (initial submission):** https://youtu.be/zYnco4uTTok

**YouTube (final submission):** https://youtu.be/QrcSl5ZI47k
