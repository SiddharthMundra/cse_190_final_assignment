## Pre-review by Siddharth Mundra, A17520533
## Review of Daniel Camunzo

### 1. Project summary/implementation

#### a. Summary
The proejct is basically a way you can make flashcards from images; it converts lecture notes photos into a specific quiz and it lets users store it and practice again later on if needed. The intended users are of course students; and this project is the run it locally option. 

#### b. Demo attempt


Yep; I followed DEMO.md and could get the tool up and running. I had to enter my own ENV keys but apart from that everyting ran perfectly.


#### c. Proposal component check

Implemented as written:

1. Quiz Session Manager: The student had mentioned that they would implement this: create_quiz_session(deck_id, user_id, db) creates a quiz_sessions row and one quiz_items row per flashcard. get_next_pending_item(session_id, db) returns the next pending item. Lives in flashcard-app/quiz_session.py. Tables are initialized in database.py via init_quiz_tables() called from init_db(). I went through the code and it is implemented exactly as mentioned.

2. Question Generator: It takes front and back text, calls TritonAI with a system prompt that constrains the question to concepts directly stated on the card, and returns a single question string. Lives in flashcard-app/tutor_llm.py. The prompt is:

"You create a single exam-style question (not multiple choice) from the study card content. "
"Do not reveal the answer or echo it verbatim. "
"Ask only what is directly stated on the card. Do not ask for examples, code, or concepts not present in the card text."
"Return only the question text with no extra commentary."


Planned:

1. Multple choice mode: this definately seems reasonable; it would just need to make another call to the LLM and get options and format the output from the LLM to display to the user.
2. Hint systems: this also definately seems reasonable; we just would have to strictly ask the LLM to give an output in a specific format (maybe json) so we can extract the hint and display it properly

#### d. One confusing thing
Because the website UI is so fairly simple; i could not tell that it is connected to a backend database; i just thought it was something that was running locally and stores data locally.

#### e. A conversation starter for Tuesday
What influenced your UI choices? I noticed the UI was extremely basic with barely any styling/animations; and an AI could easily change it into something more new/modern; but did you choose to keep the design simple yourself?


### 2. Suggestions

#### a. Scope feedback for the final deliverable
I looked at the after first deliverable goals; they seem fairly simple to jimplement. I dont see anything as a groundbreaking decision or something really riesky that I wouldnt suggest to go ahead with.


#### b. One concrete suggestion
I would definately suggest suing an agent to transform the UI of the website; if it is something you want students to use, usability and visual appeal are critical to adoption. Since the platform is intended for students, the current UI appears too basic and lacks the level of polish expected from modern educational tools. Given that students are accustomed to highly refined applications, investing in a stronger UI would significantly enhance the overall user experience

#### c. Something you learned or thought was cool
I really liked the idea; I forgot flashcards were even a thing anymore. Everyone (including me) is so used to copy pasting my lecture notes into chatgpt and asking it to make sample questions and answers i forgot flashcards even existed!
