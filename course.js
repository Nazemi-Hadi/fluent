// Fluent course content. ASCII only.
// Words: "phrase|meaning|example|image search (optional)". 6 per day, days 1-6 of each week.
var COURSE = {
  phases: [
    {n: 1, name: "Foundation", weeks: "1-4", goal: "Everyday spoken chunks, word stress and sounds, tenses you use every day."},
    {n: 2, name: "Fluency", weeks: "5-8", goal: "Faster word retrieval, talking for longer, narratives and opinions."},
    {n: 3, name: "Accents & real life", weeks: "9-12", goal: "Scottish and regional accents, fast connected speech, phone calls and services."},
    {n: 4, name: "Explaining & storytelling", weeks: "13-16", goal: "Telling stories, explaining processes, discussing problems, final talk."}
  ],

  weeks: [
    {n: 1, theme: "Daily life & routines", grammar: "Present simple vs present continuous", sound: "Word stress",
     tip: "The stressed syllable is longer, louder and higher: COMfortable, deVELopment, phoTOgraphy. Unstressed syllables shrink to a quick 'uh'. In phrasal verbs the little word is usually stressed: catch UP, pop OUT, wind DOWN."},
    {n: 2, theme: "Work & study", grammar: "Past simple", sound: "-ed endings",
     tip: "-ed has three sounds. /t/ after voiceless sounds: worked, helped, finished. /d/ after voiced sounds: called, moved, played. An extra syllable /id/ ONLY after t or d: wanted, needed, decided. 'Worked' is one syllable - never 'work-ed'."},
    {n: 3, theme: "Home, shopping & money", grammar: "Present perfect vs past simple", sound: "The schwa (weak 'uh')",
     tip: "The most common sound in English is the schwa: a short, lazy 'uh'. It replaces the vowel in unstressed syllables and small words: a, the, to, for, of, and, can. 'A cup of tea' sounds like 'uh CUP uh TEA'. 'Bargain' sounds like 'BAR-gn'."},
    {n: 4, theme: "Health & the GP", grammar: "Talking about the future (will / going to / present continuous)", sound: "TH sounds",
     tip: "Voiceless TH (think, three, health, month): air only. Voiced TH (the, this, mother, breathe): add your voice. Put the tip of your tongue lightly between your teeth. Don't swap it for s/z or t/d: 'think', not 'sink' or 'tink'."},
    {n: 5, theme: "Food & eating out", grammar: "Past continuous & telling what happened", sound: "Weak forms (was, were, can, to)"},
    {n: 6, theme: "Travel & transport", grammar: "Modals: can, could, should, have to, must", sound: "Linking words together"},
    {n: 7, theme: "Feelings & relationships", grammar: "First and second conditionals", sound: "Intonation in questions"},
    {n: 8, theme: "News & opinions", grammar: "Giving opinions, agreeing, comparing", sound: "Sentence stress"},
    {n: 9, theme: "Phone calls & services", grammar: "Polite requests & indirect questions", sound: "The glottal stop (wa'er, bu'er)"},
    {n: 10, theme: "Small talk & British culture", grammar: "Question tags", sound: "Scottish vowels and rolled R"},
    {n: 11, theme: "Technology & the internet", grammar: "The passive voice", sound: "Contractions in fast speech"},
    {n: 12, theme: "Bills, banking & paperwork", grammar: "Used to / would / be used to", sound: "Elision (dropped sounds)"},
    {n: 13, theme: "Telling stories", grammar: "Past perfect & narrative tenses", sound: "Rhythm and timing"},
    {n: 14, theme: "Explaining processes", grammar: "Sequencing, instructions, passive", sound: "Chunking and pausing"},
    {n: 15, theme: "Problems & solutions", grammar: "Third and mixed conditionals", sound: "Persuasive intonation"},
    {n: 16, theme: "Review & final talk", grammar: "All tenses together", sound: "Review of all sounds"}
  ],

  words: {
    1: [
      "run errands|go out to do small jobs like shopping or going to the post office|I spent Saturday morning running errands in town.|errands shopping",
      "be running late|be later than you planned|Sorry, I'm running late - the bus didn't turn up.|late clock",
      "catch up on|do something you didn't have time for earlier|I need to catch up on some sleep this weekend.|sleeping",
      "a lie-in|staying in bed later than usual in the morning|I had a lovely lie-in on Sunday.|sleeping in bed morning",
      "commute|the regular journey to work or university|My commute takes about forty minutes each way.|commuters train",
      "grab a bite|eat something quickly|Shall we grab a bite before the lecture?|sandwich lunch",
      "do the washing-up|wash the dishes after a meal|I'll cook if you do the washing-up.|washing dishes",
      "put the kettle on|start boiling water to make tea|Come in, I'll put the kettle on.|kettle tea",
      "tidy up|make a place neat and organised|I tidied up the flat before my friends came.|tidy room",
      "hoover|clean the floor with a vacuum cleaner|I usually hoover the living room on Fridays.|vacuum cleaner",
      "take the bins out|put the rubbish outside for collection|Whose turn is it to take the bins out?|wheelie bin",
      "chores|regular jobs you do at home|We split the chores between us.|housework",
      "knackered|very tired (informal)|I'm absolutely knackered after that shift.|tired man",
      "chill out|relax completely|I just want to chill out tonight.|relaxing sofa",
      "wind down|relax after a busy period|I read for half an hour to wind down before bed.|reading in bed",
      "fancy|want, or like the idea of something|Do you fancy a coffee?|coffee cup",
      "can't be bothered|don't have the energy or interest to do something|I can't be bothered to cook tonight.|lazy",
      "be on the go|be busy and active all the time|I've been on the go all day.|busy people",
      "pop out|go out for a short time|I'm just popping out to the shop.|street shop",
      "pop in|visit somewhere briefly|Pop in for a cup of tea whenever you're passing.|front door",
      "the corner shop|a small local shop that sells food and basics|I'll get some milk from the corner shop.|corner shop",
      "a takeaway|food you buy from a restaurant to eat at home|Let's just get a takeaway tonight.|takeaway food",
      "get round to|finally find time to do something|I haven't got round to calling the landlord yet.|to do list",
      "keep meaning to|plan to do something but not do it|I keep meaning to call my aunt.|reminder note",
      "now and then|sometimes, not regularly|I still play football now and then.|football",
      "as a rule|usually, in general|As a rule, I don't check emails after seven.|email phone",
      "these days|nowadays, at the present time|These days I work from home on Mondays.|working from home",
      "every other day|on alternate days|I go to the gym every other day.|gym",
      "most of the time|usually|Most of the time the trains are on time.|train station",
      "once in a blue moon|very rarely|I only drive into the city once in a blue moon.|blue moon",
      "keep in touch|continue to contact someone|We keep in touch on WhatsApp.|phone chat",
      "catch up with someone|talk to someone you haven't seen for a while|Let's meet next week and catch up.|friends coffee",
      "hang out|spend time with friends in a relaxed way|We usually hang out at the park on Sundays.|friends park",
      "make plans|arrange to do something|Have you made any plans for the weekend?|calendar",
      "be up for|be willing or happy to do something|I'm up for a walk if you are.|walking",
      "it depends|the answer changes with the situation|It depends on the weather, really.|weather sky"
    ],
    2: [
      "work from home|do your job at home instead of the office|I work from home two days a week.|home office laptop",
      "be snowed under|have far too much work|I'm snowed under with marking this week.|pile of papers",
      "a deadline|the time by which work must be finished|The deadline for the report is Friday.|deadline calendar",
      "meet a deadline|finish work on time|We worked late to meet the deadline.|office night",
      "take on|accept extra work or responsibility|I've taken on a few extra hours this term.|work desk",
      "in charge of|responsible for something or someone|Who's in charge of the new project?|team leader",
      "a heads-up|an early warning about something|Thanks for the heads-up about the meeting.|meeting",
      "get back to someone|reply to someone later|Let me check and get back to you.|phone call",
      "follow up|contact someone again to continue something|I'll follow up with an email after the call.|email",
      "touch base|briefly contact someone to check progress|Let's touch base on Thursday.|colleagues talking",
      "run something by someone|ask someone's opinion about an idea|Can I run an idea by you?|discussion",
      "on the same page|agreeing or understanding the same thing|Let's make sure we're all on the same page.|team meeting",
      "hand in|give your work to a teacher or boss|I have to hand in my essay by Monday.|essay",
      "a module|one course unit at a university|I'm teaching two modules this semester.|university lecture",
      "fall behind|fail to keep up with work|I fell behind with the reading last week.|books",
      "keep up with|stay at the same speed or level as|It's hard to keep up with all the emails.|inbox",
      "go over|check or review something carefully|Can we go over the main points again?|notes",
      "figure out|understand or solve something|I can't figure out how this system works.|puzzle",
      "a colleague|a person you work with|One of my colleagues is from Glasgow.|colleagues",
      "a line manager|the person directly above you at work|I need to ask my line manager first.|manager",
      "a shift|a period of working time|I'm on the early shift tomorrow.|nurse shift",
      "time off|time when you are not working|I'm taking some time off at Christmas.|holiday",
      "call in sick|phone work to say you are ill|She called in sick this morning.|sick in bed",
      "annual leave|paid holiday from work|How much annual leave do you get?|beach holiday",
      "be good at|have skill in something|I'm good at explaining complicated ideas.|teacher",
      "have experience in|have done a type of work before|I have experience in data analysis.|data analysis",
      "be responsible for|have the job of dealing with something|I'm responsible for running the seminars.|seminar",
      "be involved in|take part in an activity|I'm involved in a research project.|research",
      "a steep learning curve|a lot to learn in a short time|The first month was a steep learning curve.|steep hill",
      "get the hang of|learn how to do something|I'm finally getting the hang of the new software.|computer",
      "How's it going?|informal: how are you, how are things|Hi Tom, how's it going?|greeting",
      "not too bad|a modest, normal answer meaning OK|Not too bad, thanks - busy as usual.|smile",
      "What do you do?|what is your job|So what do you do?|handshake",
      "I'm in (finance)|I work in the field of|I'm in finance, actually.|finance",
      "it's been a long day|I'm tired after a busy day|It's been a long day - I need a cuppa.|cup of tea",
      "anyway|used to change the topic or finish a chat|Anyway, I'd better get going.|goodbye"
    ],
    3: [
      "a flat|an apartment|We rent a two-bedroom flat near the station.|flat building",
      "the landlord|the person who owns the home you rent|I've emailed the landlord about the heating.|house keys",
      "the deposit|money paid at the start that you get back later|We got our full deposit back.|money",
      "council tax|a local tax paid for each home|Council tax is due on the first of the month.|bills",
      "bills included|the rent includes gas, electricity and so on|Is the rent bills included?|bills",
      "move in|start living in a new home|We moved in last September.|moving boxes",
      "the boiler|the machine that heats water and the home|The boiler has broken again.|boiler",
      "leaking|letting water escape|The kitchen tap is leaking.|leaking tap",
      "sort out|fix or organise something|The landlord said he'd sort it out this week.|repair",
      "damp|slightly wet, often on walls|There's a damp patch in the bathroom.|damp wall",
      "a plumber|a person who fixes pipes and water systems|We need to call a plumber.|plumber",
      "get something fixed|arrange for someone to repair it|I need to get my phone screen fixed.|broken phone",
      "a bargain|something cheap and good|This coat was a real bargain.|sale",
      "on offer|at a special, lower price|Strawberries are on offer this week.|supermarket offer",
      "a rip-off|something far too expensive|Five pounds for a coffee? What a rip-off!|expensive",
      "shop around|compare prices in different shops|It pays to shop around for insurance.|shopping",
      "a receipt|a paper that proves you paid|Keep the receipt in case you need to return it.|receipt",
      "a refund|money given back to you|I took it back and got a full refund.|refund",
      "Do you have this in a ...?|asking for another size or colour|Excuse me, do you have this in a medium?|clothes shop",
      "I'm just looking|I don't need help yet (in a shop)|No thanks, I'm just looking.|clothes shop",
      "self-checkout|a machine where you scan your own shopping|The self-checkout isn't working again.|self checkout",
      "a bag for life|a strong, reusable shopping bag|Do you need a bag for life?|reusable bag",
      "contactless|paying by touching a card or phone on a reader|Can I pay contactless?|contactless payment",
      "a loyalty card|a card that collects points in a shop|Have you got a loyalty card?|loyalty card",
      "skint|having no money (informal)|I'm skint until payday.|empty wallet",
      "payday|the day you get paid|Payday is the last Friday of the month.|payday",
      "tight on money|not having much money|We're a bit tight on money this month.|wallet",
      "save up for|keep money to buy something later|I'm saving up for a new laptop.|piggy bank",
      "splash out|spend a lot of money on something nice|We splashed out on a nice dinner.|restaurant dinner",
      "afford|have enough money for something|I can't afford to go away this year.|money",
      "the cost of living|the money needed for basic things|The cost of living has gone up a lot.|groceries",
      "energy bills|the cost of gas and electricity|Our energy bills doubled last winter.|electricity meter",
      "a direct debit|an automatic regular payment from your bank|I pay the phone bill by direct debit.|bank",
      "be overcharged|be asked to pay too much|I think I've been overcharged.|bill",
      "a subscription|a regular payment for a service|I cancelled my streaming subscription.|streaming",
      "good value for money|worth the price you pay|The lunch deal is good value for money.|lunch"
    ],
    4: [
      "register with a GP|join a local doctor's practice|You should register with a GP when you move.|doctor",
      "book an appointment|arrange a time to see someone|I booked an appointment for Tuesday.|appointment",
      "the receptionist|the person at the front desk|The receptionist asked what the problem was.|receptionist",
      "a prescription|a doctor's note that lets you get medicine|The GP gave me a prescription for antibiotics.|prescription",
      "the chemist|a pharmacy, a shop that sells medicine|You can collect it from the chemist.|pharmacy",
      "over the counter|without a prescription|You can buy ibuprofen over the counter.|medicine",
      "a sore throat|pain in your throat|I've got a sore throat and a temperature.|sore throat",
      "a temperature|a fever, a high body temperature|He's had a temperature since last night.|thermometer",
      "under the weather|feeling a bit ill|I'm feeling a bit under the weather today.|sick",
      "a runny nose|a nose that keeps producing liquid|It's just a cold - a runny nose and a cough.|tissue",
      "come down with|start to get an illness|I think I'm coming down with something.|cold flu",
      "get over|recover from an illness or problem|It took me two weeks to get over the flu.|recovery",
      "It hurts when I ...|describing pain linked to an action|It hurts when I bend my knee.|knee pain",
      "a sharp pain|a sudden, strong pain|I've got a sharp pain in my side.|pain",
      "a dull ache|a weak, continuous pain|It's more of a dull ache than a sharp pain.|backache",
      "swollen|bigger than normal because of an injury|My ankle is a bit swollen.|swollen ankle",
      "dizzy|feeling that things are spinning|I felt dizzy when I stood up.|dizzy",
      "on and off|sometimes, not continuously|I've had headaches on and off for a week.|headache",
      "NHS 111|the NHS phone and online service for urgent advice|If it gets worse, call 111.|phone",
      "A&E|the hospital emergency department|We waited four hours in A&E.|hospital",
      "a walk-in centre|a clinic you can visit without booking|There's a walk-in centre in the city centre.|clinic",
      "a fit note|a doctor's note for your employer|I need a fit note for work.|doctor note",
      "a check-up|a routine medical or dental examination|I'm due for a dental check-up.|dentist",
      "side effects|unwanted effects of a medicine|Are there any side effects?|pills",
      "get some fresh air|go outside|Let's go for a walk and get some fresh air.|fresh air walk",
      "keep fit|stay healthy through exercise|I cycle to work to keep fit.|cycling",
      "cut down on|reduce how much you have of something|I'm trying to cut down on sugar.|sugar",
      "give up|stop doing a habit|He gave up smoking last year.|no smoking",
      "work out|do physical exercise|I work out three times a week.|workout",
      "get enough sleep|sleep as much as you need|I haven't been getting enough sleep lately.|sleep",
      "I'm going to ...|talking about a plan you've decided|I'm going to start running in the mornings.|running",
      "I'll probably ...|a likely future action|I'll probably see the doctor next week.|doctor",
      "I'm seeing (someone) on ...|an arranged meeting in the future|I'm seeing the physio on Friday.|physiotherapy",
      "I'm thinking of ...|considering a plan|I'm thinking of joining a gym.|gym",
      "hopefully|I hope that|Hopefully I'll feel better by the weekend.|sunshine",
      "take it easy|rest and don't work too hard|The doctor told me to take it easy for a few days.|rest"
    ]
  },

  // Tense & sentence prompts: q = question, f = sentence frame, m = model answer.
  tense: {
    1: [
      {q: "Describe a typical weekday for you, from morning to evening.", f: "I usually... / First I... then I... / After that I...", m: "I usually get up at seven, put the kettle on and check my emails. Then I catch the train, and I start work at nine. After work I normally go to the gym."},
      {q: "What are you doing these days that's different from usual?", f: "These days I'm ...ing / At the moment I'm ...ing", m: "These days I'm working from home more, and I'm trying to go to bed a bit earlier. I'm also learning to cook some Scottish dishes."},
      {q: "How often do you do the housework? Use frequency words.", f: "I ... every day / every other day / once a week / hardly ever", m: "I do the washing-up every day, I hoover once a week, and to be honest I hardly ever iron anything."},
      {q: "A friend calls you right now. Explain what you're doing and why you can't talk.", f: "Sorry, I'm ...ing at the moment. I'm ... so ...", m: "Sorry, I'm just cooking dinner at the moment and I'm running a bit late, so can I call you back in half an hour?"},
      {q: "What do you normally do at weekends - and what are you doing this weekend?", f: "Normally I... but this weekend I'm ...ing", m: "Normally I have a lie-in and go for a long walk, but this weekend I'm visiting some friends in Edinburgh."},
      {q: "Describe a friend: what do they do, and what are they doing these days?", f: "She works as... / He lives in... / At the moment she's ...ing", m: "My friend Sara works as a nurse. She lives in Leeds, but at the moment she's staying with her parents because she's looking for a new flat."},
      {q: "What do people in the UK usually do that felt strange to you at first?", f: "People here tend to... / They always... / They never...", m: "People here tend to say sorry all the time, they always queue, and they never seem to complain directly - they just say 'it's fine'."},
      {q: "What's changing in your city at the moment?", f: "They're building... / Prices are going up... / More people are ...ing", m: "They're building a new road near the river, rents are going up, and more and more people are cycling to work."}
    ],
    2: [
      {q: "Tell me about your first day at your current job or university.", f: "On my first day I... / I met... / I felt...", m: "On my first day I got lost twice. I met my line manager, who showed me around, and I felt quite nervous, but everyone was really friendly."},
      {q: "What did you do yesterday, step by step?", f: "First I... Then I... After that... In the end...", m: "First I answered some emails, then I taught a seminar. After that I went to the gym, and in the end I just watched a film and went to bed."},
      {q: "Tell me about a deadline you nearly missed.", f: "I had to... but... so I... In the end...", m: "I had to hand in a report on Friday, but I fell behind, so I worked most of Thursday night. In the end I met the deadline - just."},
      {q: "Describe a mistake you made at work or university and what you learned.", f: "I made a mistake when I... I didn't... so... I learned that...", m: "I made a mistake when I sent an email to the wrong group. I didn't check the list, so everyone saw it. I learned that it's worth reading everything twice."},
      {q: "When did you last take time off? What did you do?", f: "I took ... off in... I went... / I stayed... It was...", m: "I took a week off in August. I went to the Highlands with a friend, we walked a lot and it rained every day, but it was brilliant."},
      {q: "Tell me about a teacher or boss who influenced you.", f: "When I was... I had a... He/She always... One day...", m: "When I was at university I had a professor who always asked difficult questions. One day she told me my idea was good but my explanation was bad - and she was right."},
      {q: "How did you find your current job or course?", f: "I saw... / I applied... / I had an interview... / They offered me...", m: "I saw the advert online, I applied the same day, and two weeks later I had an interview. They offered me the job a few days after that."},
      {q: "What did you do last weekend?", f: "On Saturday I... / On Sunday I... / It was...", m: "On Saturday I ran some errands and met a friend for lunch. On Sunday I had a lie-in and then caught up on some work. It was quiet but nice."}
    ],
    3: [
      {q: "How long have you lived in your current home? When did you move in?", f: "I've lived here for/since... I moved in in...", m: "I've lived here for about two years. I moved in in September, just before the term started."},
      {q: "What has gone wrong in your home recently?", f: "The ... has broken / has stopped working. It happened when... I've already... / ... hasn't ... yet", m: "The washing machine has stopped working. It happened last week. I've already called the landlord, but he hasn't sorted it out yet."},
      {q: "What's the best thing you've bought this year? When did you buy it?", f: "The best thing I've bought is... I bought it... It was...", m: "The best thing I've bought this year is a good winter coat. I bought it in the January sales and it was a real bargain."},
      {q: "Have you ever returned something to a shop? What happened?", f: "Yes, I have. Last year I bought... It was... so I took it back and...", m: "Yes, I have. Last month I bought some headphones, but one side didn't work, so I took them back and got a full refund."},
      {q: "What have you done this week to save money?", f: "This week I've... / I haven't... / I've started...", m: "This week I've cooked at home every night, I've cancelled a subscription I never used, and I haven't bought any coffee out."},
      {q: "How have your spending habits changed since you came to the UK?", f: "Since I came here, I've started... / I've stopped... When I first arrived, I...", m: "Since I came here I've started shopping around much more. When I first arrived I just went to the nearest shop, but I've learned that prices vary a lot."},
      {q: "Have you ever been overcharged? What did you do?", f: "Yes, once I... I noticed that... so I...", m: "Yes, once at a restaurant they charged us for three drinks instead of two. I noticed it when I checked the bill, so I told the waiter and he fixed it."},
      {q: "What have you never done in the UK that you'd like to do?", f: "I've never... but I'd love to... I've always wanted to...", m: "I've never been to Cornwall, but I'd love to go. I've always wanted to see the coast there and try a proper Cornish pasty."}
    ],
    4: [
      {q: "What are your plans for this weekend?", f: "I'm ...ing (arranged) / I'm going to... (decided plan)", m: "On Saturday I'm meeting a friend for lunch, and on Sunday I'm going to clean the flat and prepare for next week."},
      {q: "Your friend is ill. Offer to help.", f: "I'll... / Shall I...? / I'll ... for you", m: "Don't worry, I'll pop to the chemist for you. Shall I get you some paracetamol? I'll bring it round later this afternoon."},
      {q: "What are you going to change about your lifestyle next month?", f: "I'm going to... / I'm not going to... / I'm thinking of...", m: "I'm going to cut down on sugar and I'm going to walk to work at least three times a week. I'm also thinking of joining a gym."},
      {q: "Predict: what will your life be like in five years?", f: "I think I'll... / I probably won't... / Hopefully I'll...", m: "I think I'll still live in the UK, but I probably won't be in the same flat. Hopefully I'll have a job I really enjoy and speak English without thinking."},
      {q: "Call the GP receptionist and arrange an appointment. What do you say?", f: "I'd like to... / Have you got anything on...? / I'll take...", m: "Hi, I'd like to book an appointment with a GP, please. Have you got anything on Thursday afternoon? Great, I'll take the three o'clock."},
      {q: "What appointments or meetings have you got next week?", f: "On Monday I'm seeing... / On Wednesday I've got... / I'm meeting...", m: "On Monday I'm seeing my line manager, on Wednesday I've got a dentist appointment, and on Friday I'm meeting some colleagues for dinner."},
      {q: "The doctor gives you advice. What are you going to do now?", f: "The doctor told me to... so I'm going to... I won't...", m: "The doctor told me to take it easy, so I'm going to work from home for a few days, and I won't go to the gym until next week."},
      {q: "What will you do if you feel ill tomorrow?", f: "If I feel ill, I'll... / I won't... / I'll probably...", m: "If I feel ill tomorrow, I'll call in sick and stay in bed. I probably won't go to the GP unless it gets worse."}
    ]
  },

  // Shadowing sentences for the week's sound.
  shadow: {
    1: [
      "I usually get up at seven and catch the train to work.",
      "She's working from home this week because her son is ill.",
      "Could you pop into the corner shop on your way back?",
      "We normally have a takeaway on Friday evenings.",
      "I'm absolutely knackered - I've been on the go all day.",
      "Do you fancy grabbing a bite after work?",
      "As a rule, I try to wind down before eleven.",
      "I'm not really up for going out tonight, to be honest."
    ],
    2: [
      "I worked late yesterday and finished the report at ten.",
      "She called in sick, so I covered her shift.",
      "We decided to postpone the meeting until Thursday.",
      "I handed in my essay just before the deadline.",
      "He looked tired, so I offered to help.",
      "They needed more time, so we extended the deadline.",
      "I really enjoyed the module, but I fell behind with the reading.",
      "My manager asked me to follow up with the client."
    ],
    3: [
      "Can I have a bag for life, please?",
      "The landlord said he'd sort out the boiler on Tuesday.",
      "We've been looking for a flat for about a month.",
      "I bought this jacket in the sale - it was a bargain.",
      "Our energy bills are much higher than last year.",
      "I'm saving up for a holiday in the summer.",
      "Do you have this in a smaller size?",
      "There's a problem with the heating in the bathroom."
    ],
    4: [
      "I think I'm coming down with something.",
      "I've had this cough for three weeks now.",
      "The doctor said there's nothing to worry about.",
      "Breathe in slowly through your nose, then breathe out.",
      "My throat has been sore since Thursday.",
      "I'm going to the pharmacy with my brother.",
      "Health is more important than anything else.",
      "Thanks, I'll take it easy for the rest of the month."
    ]
  },

  // One talk topic per day (days 1-6).
  topics: {
    1: [
      {t: "Your mornings", qs: ["What does a normal morning look like for you?", "Are you a morning person? Why or why not?", "What would your perfect lazy Sunday look like?"]},
      {t: "Housework", qs: ["Which chores do you hate, and which don't you mind?", "How is the housework split where you live?", "Did you have to help at home as a child?"]},
      {t: "Tiredness and relaxing", qs: ["What makes you really tired?", "How do you wind down after a long day?", "What do you do when you can't be bothered to cook?"]},
      {t: "Your local area", qs: ["Describe the shops near where you live.", "What do you pop out for most often?", "What do you keep meaning to do but never get round to?"]},
      {t: "Habits", qs: ["What do you do every other day or every week?", "What do you do only once in a blue moon?", "How are your habits these days different from five years ago?"]},
      {t: "Friends", qs: ["How do you keep in touch with friends abroad?", "What do you like doing when you hang out with friends?", "What plans have you made for this weekend?"]}
    ],
    2: [
      {t: "Your job", qs: ["What do you do, and what are you in charge of?", "When were you last snowed under with work?", "How do you deal with tight deadlines?"]},
      {t: "Communication at work", qs: ["How do you prefer colleagues to contact you?", "Tell me about a time you had to follow up on something.", "What makes a meeting useful or useless?"]},
      {t: "Studying", qs: ["What did you study, and what was it like?", "Have you ever fallen behind? What did you do?", "What's something you recently figured out?"]},
      {t: "Working life in the UK", qs: ["How is working in the UK different from your home country?", "Tell me about your colleagues.", "What did you do on your last day off?"]},
      {t: "Skills", qs: ["What are you good at?", "Tell me about something with a steep learning curve.", "What skill would you like to get the hang of?"]},
      {t: "Small talk at work", qs: ["How do you answer 'How's it going?' naturally?", "Describe your last long day.", "What did you do last weekend?"]}
    ],
    3: [
      {t: "Renting", qs: ["Describe the place you live in.", "What's your landlord like?", "Tell me about the day you moved in."]},
      {t: "Things breaking", qs: ["What broke in your home recently, and how did you sort it out?", "Have you ever had problems with damp or heating?", "Can you fix things yourself?"]},
      {t: "Bargains", qs: ["What's the best bargain you've ever found?", "What do you think is a rip-off in the UK?", "Have you ever asked for a refund?"]},
      {t: "Shopping habits", qs: ["Do you prefer shopping online or in person? Why?", "Where do you do your food shopping?", "What's the last thing you bought, and why?"]},
      {t: "Money", qs: ["What are you saving up for?", "When did you last splash out on something?", "What can't you afford at the moment but would like?"]},
      {t: "The cost of living", qs: ["How has the cost of living changed since you came to the UK?", "Which bills annoy you most?", "What's good value for money where you live?"]}
    ],
    4: [
      {t: "The NHS", qs: ["Have you registered with a GP? How did it go?", "How does healthcare here compare with your home country?", "What's it like to book an appointment?"]},
      {t: "Being ill", qs: ["When did you last feel under the weather?", "What do you do when you come down with a cold?", "How long does it usually take you to get over a cold?"]},
      {t: "Describing symptoms", qs: ["Describe a time you hurt yourself.", "How would you explain a pain to a doctor?", "Have you ever felt dizzy? What happened?"]},
      {t: "Emergencies", qs: ["Have you ever been to A&E? What happened?", "When should you call 111 rather than 999?", "Do you go for regular check-ups?"]},
      {t: "Healthy habits", qs: ["What do you do to keep fit?", "What are you trying to cut down on?", "Do you get enough sleep? Why or why not?"]},
      {t: "Health plans", qs: ["What are you going to change about your lifestyle?", "What are you doing next week to look after yourself?", "Where do you see your health in a year's time?"]}
    ]
  },

  // Role-plays: each line = [what they say, what you should do, a model answer].
  scen: {
    1: [
      {t: "Bumping into a neighbour", s: "You meet your neighbour on the stairs on a Saturday morning.", lines: [
        ["Morning! You're up early for a Saturday.", "Reply and explain why you're up early.", "Morning! Yeah, I've got a few errands to run, so I thought I'd get them out of the way."],
        ["Oh, anything exciting?", "Say what you need to do and ask about them.", "Not really - just the post office and a bit of food shopping. How about you?"],
        ["Just popping out for a paper, then back for a lie-in, hopefully.", "React and wish them a nice weekend.", "Sounds lovely. Enjoy the rest of your weekend!"]]},
      {t: "Making weekend plans", s: "A friend messages you and then calls.", lines: [
        ["Hey! Are you up to anything this weekend?", "Say you haven't got plans yet.", "Not much, to be honest. I haven't made any plans yet. Why?"],
        ["Fancy going for a walk on Sunday and grabbing a bite after?", "Accept and suggest a time.", "Yeah, I'm up for that. How about meeting around eleven?"],
        ["Eleven works. Where shall we meet?", "Suggest a place.", "Let's meet outside the station - it's easy for both of us."],
        ["Perfect. See you then!", "Close naturally.", "Great, see you Sunday. Text me if anything changes."]]}
    ],
    2: [
      {t: "A colleague needs something", s: "A colleague stops by your desk.", lines: [
        ["Hi, sorry to bother you - have you got a minute?", "Say yes, but you only have a few minutes.", "Sure, I've got about five minutes. What's up?"],
        ["Could you send me the slides from yesterday's meeting?", "Agree and say when.", "Of course. I'll send them over after lunch, if that's OK."],
        ["Great, thanks. Are you coming to the team meeting on Thursday?", "Say you're not sure and will confirm.", "I'm not sure yet - I might have a seminar. Let me check and get back to you."],
        ["No problem. Thanks a lot!", "Close.", "No worries. Speak later!"]]},
      {t: "Small talk in the staff kitchen", s: "You're making tea and someone comes in.", lines: [
        ["Hiya, how's it going?", "Answer naturally and ask back.", "Not too bad, thanks - a bit snowed under. How about you?"],
        ["Same here. It's been a long week. Any plans for the weekend?", "Talk about your plans.", "Nothing major. I'm going to catch up on some sleep and maybe see some friends."],
        ["Sounds good. So what are you working on at the moment?", "Explain your work briefly.", "I'm working on a new module at the moment. It's a steep learning curve, but it's interesting."],
        ["Oh, nice. Anyway, I'd better get back to it.", "Close the chat.", "Yeah, me too. Good to catch up!"]]}
    ],
    3: [
      {t: "Calling your landlord", s: "Your boiler has stopped working. You phone the landlord.", lines: [
        ["Hello, Mark speaking.", "Say who you are and why you're calling.", "Hi Mark, it's ... from flat 2. I'm calling about the boiler - it's stopped working."],
        ["Oh no. Since when?", "Say when and describe the problem.", "Since yesterday evening. There's no hot water and the heating won't come on."],
        ["Right. I'll try to get a plumber round. When are you in?", "Give your availability.", "I'm in all day on Wednesday, or after five on Thursday."],
        ["OK, I'll let you know. Anything else?", "Mention a second, smaller problem.", "Actually, yes - there's a damp patch in the bathroom. Could someone have a look at that too?"]]},
      {t: "Returning something to a shop", s: "You bought a jumper that's too small.", lines: [
        ["Hi there, how can I help?", "Say you want to return something and why.", "Hi, I'd like to return this jumper, please. It's too small."],
        ["No problem. Have you got the receipt?", "Answer.", "Yes, here you go. I bought it last Saturday."],
        ["Would you like to exchange it or get a refund?", "Choose and explain.", "Could I exchange it for a medium? If you haven't got one, I'll take a refund."],
        ["We've got a medium here. Is that all right?", "Close politely.", "Perfect, thanks so much for your help."]]}
    ],
    4: [
      {t: "Booking a GP appointment", s: "You phone your GP surgery at 8am.", lines: [
        ["Good morning, Riverside Surgery. How can I help?", "Ask for an appointment.", "Hi, I'd like to book an appointment with a GP, please."],
        ["Can I take your name and date of birth?", "Give them (you can make them up).", "Sure, it's ... and my date of birth is the twelfth of March, nineteen ninety."],
        ["And what's the problem?", "Describe your symptoms briefly.", "I've had a sore throat and a temperature on and off for about a week."],
        ["We've got something on Thursday at ten forty. Does that suit you?", "Accept, or ask for another time.", "Thursday's fine, thanks. Ten forty."]]},
      {t: "At the chemist", s: "You need something for a bad cold.", lines: [
        ["Hi, can I help you?", "Ask for something for your symptoms.", "Hi, I'm looking for something for a bad cold - a sore throat and a runny nose."],
        ["Are you taking any other medication?", "Answer.", "No, nothing at the moment."],
        ["These ones are good, but they can make you a bit drowsy.", "Ask for an alternative and give a reason.", "Is there anything that won't make me drowsy? I need to drive later."],
        ["Then I'd go for these. Take two, three times a day.", "Confirm and thank them.", "Great, I'll take those. Thanks for your help."]]}
    ]
  },

  // Common spoken chunks, played by real people on YouGlish for ear training.
  ear: [
    "to be honest", "I was going to", "do you know what I mean", "at the end of the day", "what are you up to",
    "I'm not sure", "a bit of a", "sort of", "kind of", "I'll let you know", "I was wondering if",
    "it doesn't matter", "to be fair", "have a look", "let me know", "in a minute", "I haven't got",
    "there's loads of", "what do you think", "I didn't mean to", "I should have", "I could have",
    "would you like", "did you want", "not at all", "in the middle of", "as far as I know",
    "I can't remember", "it's up to you", "I don't mind", "it was such a", "what I mean is",
    "the thing is", "at the moment", "I used to", "a couple of", "out of the blue", "you know what",
    "I'm going to have to", "it turned out", "fair enough", "I'd rather"
  ],

  // Real listening, rotated daily. Glasgow-friendly: Scottish voices come up often.
  listen: [
    {name: "BBC Learning English - 6 Minute English", url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", note: "Clear standard British. Listen once without the transcript, then once with it."},
    {name: "BBC Radio Scotland (live)", url: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_scotland_fm", note: "Scottish accents in news, phone-ins and chat. Pick out three phrases you hear."},
    {name: "BBC Learning English - The English We Speak", url: "https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak", note: "Short episodes on informal British expressions."},
    {name: "BBC Radio 5 Live (live)", url: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_five_live", note: "Phone-ins with callers from all over the UK - great accent variety."},
    {name: "Glaswegian accent - YouTube", url: "https://www.youtube.com/results?search_query=glasgow+accent+interview+street", note: "Real Glasgow speech. Turn subtitles off for the first listen."},
    {name: "BBC Radio 4 (live)", url: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_fourfm", note: "Speech radio: news, interviews, discussions. Summarise one item."},
    {name: "UK regional accents - YouTube", url: "https://www.youtube.com/results?search_query=british+regional+accents+real+people+interview", note: "Scouse, Geordie, Mancunian, Yorkshire, London. Notice how vowels change."},
    {name: "BBC Sounds - podcasts", url: "https://www.bbc.co.uk/sounds/podcasts", note: "Choose any podcast on a topic you like and listen for 10+ minutes."},
    {name: "Scottish comedy & chat - YouTube", url: "https://www.youtube.com/results?search_query=scottish+comedians+stand+up", note: "Fast, informal Scottish English with lots of slang."},
    {name: "BBC Scotland News - YouTube", url: "https://www.youtube.com/results?search_query=bbc+scotland+news", note: "News read and reported in Scottish accents."}
  ]
};
