# Unfold: AI Legal Document Assistant

## Description

AI-powered contract and policy reader with Firebase-authenticated accounts, conversational document Q&A, and risk analysis deployed as a live web application (“Ship with auth + live URL”)

**Past Project Reference:** Extension of my assignment 2; https://github.com/siddharthmundra/02-doc-scanner-superman-1

I am exteidning my Assignment 2 document-scanner project into a public web app with Google sign-in, hosted frontend and API, and server-enforced usage limits so strangers cannot burn through our LLM budget (**Ship with auth + live URL**).


# Planned Technologies

- **Frontend:** React + Vite  
- **Backend:** Node + Express  
- **Login & saves:** Firebase (Google sign-in + Firestore)  
- **AI:** TritonGPT LLM API  
- **Hosting:** Static website like netlify or render  
- **PDF Processing:** PDF.js  


# First Deliverable

I plan for the first deliverable to be an agent-based document chat feature. A user uploads a PDF or .txt document, the app extracts the text, and then the user can ask questions about the document in a chat interface. Right now, it already provides a summary of each and every clause and what itmeans but i think adding an AI chatbot would be more helpful.


# Rough Architecture for First Deliverable

I plan to use a lightweight retrieval system instead of a full vector database. The backend will split the uploaded document into smaller paragraph-sized chunks using a TypeScript chunking function and store those chunks with the saved analysis. When a user asks a question, the app will search to find the most relevant chunks from the document. Those chunks, along with the user’s question and recent chat history (for context), will then be sent to TritonGPT API so the model can generate a grounded answer based only on the uploaded document. If I have enough time later, I might extend this into embeddings-based semantic search for better retrieval quality.


### Upload + Text Extraction
User uploads a PDF or .txt file. The React frontend uses PDF.js to extract plain text in the browser.

### Authentication
Firebase Google sign-in identifies the user, so each saved document/chat belongs to one account.

### Document Analysis API
The frontend sends extracted text to the Node + Express backend. The backend calls TritonGPT to create the existing summary, clause explanations, risks, and open questions.

### Document Chunking
The backend splits the document text into smaller chunks so the chat agent can search only the relevant parts instead of sending the full document every time.

### Chat Agent API
It finds relevant document chunks and asks TritonGPT to answer using only those chunks.

### Grounded Answers
The agent returns a plain-English answer, relevant quotes/sections when possible, and a note when the answer is unclear from the document.

### Firestore Saves
Saved runs get saved in the firestore database.

### History Page
User can reopen a past document analysis and continue or review the document chat.

### Usage Limits
The backend checks user identity and limits requests per user so public users cannot spam the LLM API.


# Privacy & data handling (first deliverable)

### Legal advice
**No.** Unfold is an informational reading aid for a course project. It explains uploaded text; it does not tell users what they should do legally, whether to sign, or how to litigate. The UI and README state this clearly.

### What we store
- Extracted text is processed in the browser; **paragraph chunks**, **analysis JSON**, and **chat messages** are saved in **Firestore** under the signed-in user’s Firebase UID.
- Excerpts are sent to **TritonGPT** only when the user runs analyze or chat (with per-user daily limits on the API).

### Deletion & access
- Users can **delete** a saved document (analysis, chunks, and chat) from the **History** page.
- **Other users** cannot read your data (Firestore rules: `request.auth.uid == userId`).
- **Course staff / Firebase admins** could access console data for grading or debugging; routine reading of user contracts is not intended. This is a **student demo**, not a production legal datastore.

### Risks of central storage
Storing contracts centrally creates privacy and legal-discovery risk at scale. Mitigations for this project: per-user isolation, user-initiated delete, no public sharing of uploads, no training on user documents, and clear notices not to upload unauthorized material.

### How “relevant” chunks are defined (v1)
1. **Chunking:** Split extracted text on **paragraph boundaries** (blank lines), with a max character cap per chunk.
2. **Scoring:** Rank chunks by **lexical overlap** — shared terms between the user’s question and chunk text (stopwords removed).
3. **Top-k:** Send the top **3–5** chunks plus recent chat history to TritonGPT with instructions to answer **only from those excerpts** and flag when the answer is unclear.
4. **Later (optional):** Embedding-based semantic search if time allows.


# After First Deliverable Goals

- Add multi-document comparison, such as comparing a lease with a pet policy or HOA rules.
- Add a cleaner History page with search/filter by file name and date.
- Add streaming responses so the chatbot feels faster.
- Add better server-side validation and rate limiting for public deployment.