## Review by Siddharth Mundra, A17520533
## Review of Isadora White

### 1. Project summary/implementation

#### a. Summary
_Summarize the project in a few sentences: what kind of documents does it take, what interface does it present, what does it extract?_

It basiclly takes in photos of the reciept; runs a OCR model and extracts your purchases into different catagories like food medicine etc.

#### b. GUI/backend interface
_What is the programmatic interface between the GUI and the backend that sends the user document to the backend? Be specific: identify the URL route, the parameters, HTTP method, API call, etc._

The GUI sends the uploaded receipt image to the backend through an HTTP API endpoint. The backend route accepts an image file, processes it with OCR / GPT-4o vision, extracts structured receipt data, and saves the result into SQLite.

#### c. User data in the prompt
_Identify the place in the code/prompt where user data had an effect (e.g. templated into/included in the prompt, used to inform data that is part of the prompt)._

No system prompt to influence everything. The reciept has an effect on everything.

#### d. One confusing thing
_Identify one thing you find confusing in the implementation, and describe why it's confusing and what you tried reading to understand it._

I didnt know this was connected to a database; it just looked like a simple html website and there was no way I could tell that things are being stored in the database and it was not mentioned anywhere either. 

### 2. Suggestions

#### a. Optimization/improvement of existing features
_Suggest one thing you would try to substantially improve the cost, latency, or accuracy of the application without compromising on other aspects. Give a substantive argument for why it's a good idea, grounded in details of the implementation (not just "use a smaller model")._

In the example of the CVS bill, nothing was classified as medical they were classified as incorrect things; I would improve this to improve the accuracy of the product.

#### b. Extension/feature request
_Which of the official required extensions would you suggest for this project? How would you go about it? (The reviewee isn't forced to do this one; this is for you to think a little bit about what it would look like on an unfamiliar codebase)_

I would implement a login system for users to seperate their data from differnt users.