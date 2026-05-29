## Session Log

### Prepared flow

**Document set:** I'm using **10 PDFs** in [`data/`](./data/) — they're all fake **residential lease agreements** with made-up names and addresses. `contract_1` through `contract_10` follow the same basic template but the numbers change (rent, city, dates, lease ID, etc.). I chose them on purpose so we'd have something to discuss: several leases have **bad dates** (for example the end date is **before** the start date). The app still reads the text fine, but you can't expect the model to fix that for you — someone still has to notice and explain it, which matches what they mean by meaningful corrections from the user.

**Demo document:** I'm starting the live demo with [`data/contract_1.pdf`](./data/contract_1.pdf).

- **Link to the file:** [`data/contract_1.pdf`](./data/contract_1.pdf). 

- **What gets extracted?**  
  - In the **browser**, PDF.js just dumps plain text: clauses **1–12**, lease ID **`ALVHRDMD2S`**, landlord **Jordan Wilson**, tenant **Morgan Clark**, the property on **5439 Maple Dr, Austin**, dates **2026-09-20** to **2026-09-28** (yeah, it's only **eight days**), rent **$1,910/month**, deposit **$1,004**, plus utilities, maintenance, pets, termination, all that.  
  - After analyze runs, **Unfold** shows the summary and sections in the UI, and **Download JSON** has the structured fields (`plain_summary`, `sections`, `risks`, `open_questions`). I'll add a **screenshot** of the results screen or paste part of the JSON here before we meet.

- **What's in the PDF but _not_ really extracted in a useful way?**  
  - **Signatures** are blank lines — there's nothing handwritten to capture.  
  - **Looks / layout** don't come through; I only get the reading order of the text.  
  - The app doesn't judge whether the lease is **legally reasonable** — wording like "arbitrary fees," "random conditions," or vague termination still needs a person to make sense of it.

- **What I'm correcting or adding myself:** Nothing.

---

### Live session

- Show how to upload and correct the document you chose for the above analysis,
  do corrections, show off the app. If anything mismatches the prepared
  outputs, note it in the session log by editing the pre-filled section above.
- Show the prompt that was used for the extraction.
- Allow each reviewer to upload and review a free choice of the remaining
  documents. You can drive your demoing laptop as the project author, but take
  direction from them, especially on how to correct or add information.

The project author should fill in the sections below in the same format as
above, during the session.

#### Reviewer 1

**Reviewer name:**

- What document was chosen:
- What data was extracted:
- What information is in the document that was _not_ extracted:
- What corrections/augmentations were made:

---

#### Reviewer 2

_Copy the structure above for additional reviewers._

---

### Full group

After uploading and correcting 3 documents, demo and answer the following:

**Aggregation:** _What aggregation/summarization is available in the
application across the 3 documents?_
