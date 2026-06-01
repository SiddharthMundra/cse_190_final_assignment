## Pre-review by Siddharth Mundra, A17520533
## Review of Fnu Yash

### 1. Project summary/implementation

#### a. Summary

This seems to be a auth+live URL; it is a nutrition label scanner. The users are people who want to upload nutritional images, and recieve personalised nutiroiton feedbac; primaraliy people who exercise. The tool uses a Next.js frontend, Supabase Auth, a FastAPI Python scanner backend, OpenAI vision extraction.



#### b. Demo attempt

I followed the setup instructions in the README. The overall setup was straightforward, but I wasn’t able to fully run the application because it requires several external services and credentials, such as the OpenAI API access and Supabase configuration.



#### c. Proposal component check


Implemented as written:

1. Past proejct reference: the studenbt mentioned that they would remove the old contents and add a new next js frontend under frontend, a FastAPI bridge under backend/, deployment config, and Supabase schema under supabase/. I confirmed that all of thee are implemented in app/, src/nutrition_scanner/, scripts/, tests/, data/, frontend/, backend/, render.yaml, DEPLOYMENT.md, supabase/schema.sql.

2. Title: the student mentioned that they would keep the title NutriScanAI as the production app name in the Next.js frontend shell and legacy scanner docs. I confirmed this in frontend/src/app/page.tsx, frontend/src/app/layout.tsx, README.md.

Planned:
The marked up porposal was a little vague; I couldnt find something concrete under the "planned" or the "no longer planned section"; making the format better would definateyl make it easier to understand. I saw that it was mentioned somwwhere to plan out dedicated object storage and a more robust file validation; which makes sene since users can upload anything. It looks good to me. Another thing to think about here is how one would handle sensitive images (credit card pages/explicit images).



#### d. One confusing thing
One thing that confused me was the existance of both the legacy Streamlit application and the newer Next.js production application. After reading the README, I understood that the Streamlit version is the original prototype while the Next.js version is sypposed to bethe production-facing app.

#### e. A conversation starter for Tuesday
I would like to see a live demo of the batch upload feature; to see how the system would handle extraction mistakes accross many images.

### 2. Suggestions

#### a. Scope feedback for the final deliverable

The after first deliverable goals look decent; I think the highest priority should be getting the app fully deployed and polished rather than trying to add too many new features. Most of the core functionality is already there. One thing I’d watch out for is API costs since the app uses OpenAI vision models for scanning labels. They should make sure the scan limits are working correctly so people can’t spam uploads.

#### b. One concrete suggestion
I would simplify the UI quite a bit; Right now, the app shows a lot of information throughout the processing pipeline, but as an end user I don’t think I’d want to see most of those intermediate steps. For a real-world app, I’d focus on only showing information that is actually useful to the user and hide a lot of the backend processing details. When extracting data from image, I would also  add something like a progress bar with some polished animations so users know the app is working or if something is happening in the background (loading animation).

#### c. Something you learned or thought was cool
I have always used myfitnesspal to track my stuff; but adding the idea of AI to it to personalise goals and help you seems really cool. I think it is a great idea and if carried out well can be an amazing tool for everyone to use. I also thought the architecture was interesting because it combines a modern web application stack with an existing Python AI pipeline.
