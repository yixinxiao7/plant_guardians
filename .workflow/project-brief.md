# Project Brief

What we're building, for whom, and why. Fill this in at the start of each new project.

---

## Project Name

plant guardians

## One-Line Description

plant guardians is an house plants inventory/tracker for users to track their watering schedule, fertilizing schedule, and repotting schedule as well as to get AI (gemini) advice for plant care. 

## Platform

web

## Target Users

Users that do not have a "green thumb" who are notorious plant-killers.

## Problem Statement
*[What problem does this solve? Why does it matter?]*

This application gives painfully obvious reminders to users to take care of their plant via its watering schedule, fertilizing schedule, repotting schedule, etc. It also gives users AI advice to identify what their plant is, best tips for caring for it, and can even set up schedules for it.

This application is important because most other plant-care applications are tailored towards people who already know how to take care of house plants well. This one is for everyone; it holds the hands for novices, and empowers experts. 

## Core Features (MVP)
*List the minimum set of features needed for a usable first version. Be specific — each feature should map to 1-3 sprint tasks.*

1. An inventory that lets users house their houseplants. The inventory should track the type of plant, the name of the plant, a picture of it (if given), watering schedule, fertilizing schedule, repotting schedule, and anything else needed to take care of a plant. Users should be able to add/update/remove plants from this inventory.
2. AI recommendations to help users determine what a plant is, how often it should be watered, fertilized, repotted, as well as any other helpful tips for long term care. If the user knows the plant, then they can use this to get AI feedback; otherwise users can upload a picture of the plant to get feedback.
3. Basicaly create account, login system.


## User Flows
*Describe the key user journeys. These help the Design Agent create accurate specs.*

### Flow 1: Novice user flow
1. a new user create an account 
2. they get routed to the homepage, where they see an option to add a new plant to the inventory.
3. they click the button which routes them to a new page where they create the plant info.
4. they populate the page with info about the plant, including an optional picture, a name, the watering schedule, fertilizing schedule (optional), repotting schedule (optional). They then click a button that submits their entry.
5. At the home page, they see the inventory populated with their new plant.
6. They click into it, which takes them to a new page that details the info of the plant. There is a status of the plants watering schedule, fertilizing schedule (if added), repotting schedule (if added). The status shows green if the user is on top of it. The status shows yellow if its the day to water/fertilize/repot the plant. The status shows red if the water/fertilize/repot day is past. The user has already watered the plant, so they click the checkbox that says they've watered the plant. It has a very satisfying animation that makes the user feel really good about completing the watering.

### Flow 2: intermediate user gets ai advice to take care of a plant with a picture
1. user logs in and looks at their inventory of plants. they have 3 plants they are watching. 2 of the plant cards show a green bubble, meaning no watering/fertilzing/repotting is due. the other one has a red bubble, meaning it is overdue. It says the watering is 3 days overdue, and it is very obvious that the user needs to take action immediately.
2. they got a new plant recently so they click on the button to create plant
3. on the new page, they upload a picture of the plant and click on the "get advice" button which gives them AI advice about what the plant is (based off the picture they uploaded), and how to take care of it, such as the lighting it needs, the watering it needs, fertilizing, repotting, humidity, and any other caring advice. The advice clarifies to the user what the AI thinks the plant is.
4. there is an option for the user to "accept" the ai advice. they clicked that button, and the webapp automatically filled up the rest of the form with that information (except for the name). If they clicked "reject", then the popup would close with nothing happening.

### Flow 3: intermediate user gets ai advice to take care of a plant with the type of the plant
1. A user logs in and adds a new plant
2. they do not upload a picture. Instead, they directly click on the "get advice" button. A popup appears asking the user to either upload a picture of the plant, or write the type of the plant. The user enters "spider plant", and the AI finds the closest match for that type. The AI gives caring advice on the spider plant, which the user accepts. The form info is filled in by the webapp.
3. The user saves it and now sees their new plant in the inventory.

### Flow 3: user cleans out their inventory
1. A veteran user logs in to organize their inventory.
2. They want to change the watering schedule for one of their plants, so they click the pencil button. This brings them to an editing page.
3. They change the watering schedule from every week to every 2 weeks. They then click the save button.
4. They get brought back to the inventory page and see their new changes reflected.
5. one of their plants has died, so they click the trash button. A popup shows up warning them if they want to delete the entry. They click "yes", and the entry is deleted, and they no longer see it on the inventory page.

## Out of Scope (for now)
*What we are explicitly NOT building in the first version.*

N/A

## Success Criteria
*How do we know the MVP is successful? Include measurable outcomes where possible.*

- User is able to create/update/delete entries from the inventory
- User is able to get gemini AI feedback about their plants as long as they provide a picture of their plant or the type of their plant.
- User is able to login/logout and create an account.
- User can click on their profile to bring them to a profile page; the profile page should show them their name, how long they've been a user for, how many plants they own currently.

## Design Preferences (optional)
*Any visual or UX preferences: color scheme, style (minimal, playful, corporate), reference apps, etc.*

- warm, minimal, "botanical" colors
- "japandi" style
- here are some UI designs I like:
  - https://easyplant.com/?utm_source=plants:googleads_generic&utm_medium=cpc&utm_campaign_id=20264189164&utm_adset_id=163072338123&utm_term=plants&utm_campaign=Plants_US_Google_Search_Web_Gen&utm_content=Broad&gad_source=1&gad_campaignid=20264189164&gbraid=0AAAAABPjldJ1QgImIeDMMtCbD_eADrT5z&gclid=CjwKCAjwg_nNBhAGEiwAiYPYAwLOTHBd7gJ96A0zc_Da7JtUt7Qjf9He9uW9qNyMLM1mZF6DDAJyoBoC7lkQAvD_BwE

---

*This document is written by the project owner and reviewed by the Manager Agent. It should be stable across sprints — update it only if the project direction fundamentally changes.*
