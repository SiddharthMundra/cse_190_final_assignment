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


# After First Deliverable Goals

- Add multi-document comparison, such as comparing a lease with a pet policy or HOA rules.
- Add a cleaner History page with search/filter by file name and date.
- Add streaming responses so the chatbot feels faster.
- Add better server-side validation and rate limiting for public deployment.