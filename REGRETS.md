# Regrets — Unfold

**Author:** Siddharth Mundra, A17520533

## What I wish I'd gotten to

1. **Embedding-based retrieval** —  The synonym mapping improved search accuracy by linking related terms (such as “fired” and “termination”), but it still struggled with more complexrephrasings of the same idea.

2. **Streaming chat** —     Response times felt slower because each interaction required a complete JSON request and response cycle. Implementing Server-Sent Events (SSE) could make the application feel more responsive by streaming outputs as they are generated.

4. **Stronger Encryprtion Mechanisms** — While demoing my product to the class, I was asked a question about encrypting sensitive documents and this is one thing I for sure would have gotten it if I had more time.


---

## Advice for a future engineer

- **Focus on security first.** I was asked a lot of questions about security and privacy about my project; 


- **Using structured JSON from the LLM made development much easier.** If you add new features in the future, update types.ts and normalizeAnalysis first so everything stays consistent.

- **Synonym maps are cheap wins** before embeddings. Keep them in one file (`relevance.js`) and add terms as users report misses.

- **SShow errors to users, not just developers.**, 
If document retrieval fails (maxScore === 0), display a warning in the UI so users know there may be a problem with the answer.



---


## If I Had Another Week

1. I would add SSE chat streaming to make the application feel more responsive and improve the overall demo experience.
2. I would highlight the document sections used for each answer so users can clearly see the source of the information.
3. I would add PDF clause highlighting to make key terms and important sections easier to find in generated reports.
4. I would add some sort of encryption mechanism for the contracts uploaded.