#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
function initializeFirebase() {
  if (getApps().length === 0) {
    const credential = cert({
      projectId: 'soulspect-app',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });

    initializeApp({
      credential,
      projectId: 'soulspect-app',
    });
  }
  return getFirestore();
}

// Sample data templates
const sampleJournalEntries = [
  {
    title: "Morning Reflection",
    content: "Started the day with meditation and journaling. Feeling grateful for the quiet moments before the world wakes up. There's something magical about the early morning light filtering through the window.",
    emotions: ["peaceful", "grateful", "centered"],
    mood: 5,
    triggers: ["morning routine", "meditation", "sunlight"]
  },
  {
    title: "Project Breakthrough",
    content: "Finally solved that complex problem I've been working on for weeks! The solution came to me during a walk. Sometimes stepping away from the screen is exactly what's needed.",
    emotions: ["accomplished", "excited", "relieved"],
    mood: 6,
    triggers: ["work achievement", "problem solving", "walking"]
  },
  {
    title: "Challenging Day",
    content: "Today felt overwhelming with back-to-back meetings and tight deadlines. Need to remember to take breaks and not let stress consume me. Tomorrow is a fresh start.",
    emotions: ["stressed", "overwhelmed", "tired"],
    mood: 2,
    triggers: ["work pressure", "deadlines", "meetings"]
  },
  {
    title: "Family Time",
    content: "Spent the afternoon with family playing board games and sharing stories. These simple moments remind me what truly matters in life. Laughter really is the best medicine.",
    emotions: ["joyful", "connected", "loved"],
    mood: 6,
    triggers: ["family time", "games", "laughter"]
  },
  {
    title: "Creative Flow",
    content: "Lost track of time working on my creative project today. When I'm in flow like this, everything else fades away. This is when I feel most like myself.",
    emotions: ["inspired", "focused", "fulfilled"],
    mood: 5,
    triggers: ["creativity", "flow state", "personal project"]
  },
  {
    title: "Nature Walk",
    content: "Took a long walk in the park and noticed the changing seasons. The leaves are starting to turn, and there's a crisp feeling in the air. Nature has a way of putting things in perspective.",
    emotions: ["peaceful", "observant", "grounded"],
    mood: 4,
    triggers: ["nature", "seasonal change", "walking"]
  },
  {
    title: "Learning Something New",
    content: "Started learning a new skill today. It's humbling to be a beginner again, but also exciting to challenge myself in new ways. Growth happens outside the comfort zone.",
    emotions: ["curious", "challenged", "motivated"],
    mood: 4,
    triggers: ["learning", "new skills", "personal growth"]
  },
  {
    title: "Quiet Evening",
    content: "Spent the evening reading and reflecting on the day. Sometimes the best therapy is a good book and a cup of tea. These quiet moments help me process everything.",
    emotions: ["calm", "reflective", "content"],
    mood: 4,
    triggers: ["reading", "tea", "quiet time"]
  },
  {
    title: "A Quiet Victory",
    content: "I finally cleaned out the garage after putting it off for months. It feels so good to have that task behind me. The sense of accomplishment is a real mood booster.",
    emotions: ["accomplished", "proud", "relieved"],
    mood: 6,
    triggers: ["cleaning", "organizing", "finishing tasks"]
  },
  {
    title: "Feeling Stuck",
    content: "I'm in a creative rut. Nothing I'm working on feels right, and I'm struggling to find the motivation to start anything new. I think I need to take a break and find some new inspiration.",
    emotions: ["frustrated", "stuck", "unmotivated"],
    mood: 2,
    triggers: ["creative block", "lack of ideas", "comparison"]
  },
  {
    title: "Unexpected Kindness",
    content: "A stranger paid for my coffee today. It was such a small thing, but it completely turned my day around. It’s a good reminder that there is a lot of good in the world.",
    emotions: ["surprised", "grateful", "happy"],
    mood: 7,
    triggers: ["random acts of kindness", "coffee", "positive social interactions"]
  },
  {
    title: "The Weight of Expectations",
    content: "I'm feeling a lot of pressure from work and family to succeed. I worry that I'm not doing enough or living up to what people expect of me. I need to remember that my worth isn't defined by others' opinions.",
    emotions: ["anxious", "pressured", "inadequate"],
    mood: 2,
    triggers: ["work expectations", "family pressure", "self-doubt"]
  },
  {
    title: "A Perfect Evening",
    content: "The sunset was incredible tonight. I sat on my porch and just watched the colors change. It was a simple, beautiful moment that made me feel so connected to the world.",
    emotions: ["peaceful", "awe", "content"],
    mood: 5,
    triggers: ["sunset", "nature", "quiet time"]
  },
  {
    title: "Dealing with Disappointment",
    content: "I didn't get the promotion I was hoping for. I'm trying not to let it get me down, but it's hard. I need to process this and figure out my next steps.",
    emotions: ["sad", "disappointed", "uncertain"],
    mood: 1,
    triggers: ["job rejection", "career setbacks", "disappointment"]
  },
  {
    title: "Making a New Friend",
    content: "I had a great conversation with someone new at a local event. It's been a while since I've made a new connection, and it feels nice.",
    emotions: ["hopeful", "social", "friendly"],
    mood: 6,
    triggers: ["social event", "new connections", "good conversation"]
  },
  {
    title: "Just a Regular Day",
    content: "Nothing particularly exciting happened today, and I'm okay with that. It was a calm, uneventful day, and it was exactly what I needed.",
    emotions: ["calm", "neutral", "content"],
    mood: 4,
    triggers: ["routine", "quiet day", "solitude"]
  },
  {
    title: "Feeling Overwhelmed",
    content: "I have so many things to do that I don't even know where to start. My to-do list is a mile long, and the thought of tackling it all is making me want to hide under the covers.",
    emotions: ["overwhelmed", "anxious", "paralyzed"],
    mood: 1,
    triggers: ["long to-do list", "workload", "time pressure"]
  },
  {
    title: "Remembering a Good Time",
    content: "I was looking through old photos and saw some from a trip I took a few years ago. It brought back so many happy memories. I should plan another adventure soon.",
    emotions: ["nostalgic", "joyful", "inspired"],
    mood: 7,
    triggers: ["old photos", "memories", "travel"]
  },
  {
    title: "A New Hobby",
    content: "I started painting again for the first time in years. It's messy and imperfect, but it's also incredibly therapeutic. I love having this creative outlet.",
    emotions: ["creative", "joyful", "relaxed"],
    mood: 6,
    triggers: ["painting", "new hobby", "creativity"]
  },
  {
    title: "Unresolved Conflict",
    content: "I had a difficult conversation with a friend today, and we didn't resolve anything. I feel sad and confused. I'm not sure how to move forward.",
    emotions: ["sad", "confused", "hurt"],
    mood: 1,
    triggers: ["conflict", "difficult conversations", "friendship issues"]
  },
  {
    title: "The Power of Music",
    content: "I listened to a new album on my commute today, and it was so moving. Music has a way of expressing things I can't find words for.",
    emotions: ["moved", "inspired", "connected"],
    mood: 5,
    triggers: ["music", "new songs", "commuting"]
  },
  {
    title: "Learning from Mistakes",
    content: "I made a mistake at work today. It was embarrassing, but my manager was understanding. I need to focus on what I can learn from this experience and move on.",
    emotions: ["embarrassed", "humble", "determined"],
    mood: 3,
    triggers: ["mistakes at work", "learning", "growth"]
  },
  {
    title: "A Sense of Belonging",
    content: "I went to my book club meeting tonight and felt so connected to everyone. It's a group of people who truly get me.",
    emotions: ["connected", "accepted", "happy"],
    mood: 7,
    triggers: ["book club", "socializing", "community"]
  },
  {
    title: "Exhausted",
    content: "I'm running on empty. My body and mind are both completely drained. I need to prioritize rest this weekend and not feel guilty about it.",
    emotions: ["tired", "drained", "exhausted"],
    mood: 1,
    triggers: ["busy week", "lack of sleep", "burnout"]
  },
  {
    title: "Making Progress",
    content: "I hit a new milestone in my fitness journey today. It's a great feeling to see all the hard work pay off. It reminds me to keep pushing forward.",
    emotions: ["motivated", "strong", "proud"],
    mood: 7,
    triggers: ["fitness goals", "working out", "progress"]
  },
  {
    title: "Dealing with Uncertainty",
    content: "I'm waiting to hear back about something important, and the waiting is the hardest part. My mind keeps jumping to the worst-case scenarios. I need to find a way to stay present.",
    emotions: ["anxious", "nervous", "uncertain"],
    mood: 2,
    triggers: ["waiting", "uncertain future", "overthinking"]
  },
  {
    title: "Feeling Nostalgic",
    content: "I saw an old movie from my childhood, and it brought back so many memories. I miss the simplicity of those times.",
    emotions: ["nostalgic", "sentimental", "longing"],
    mood: 4,
    triggers: ["old movies", "childhood memories", "the past"]
  },
  {
    title: "A Glimmer of Hope",
    content: "Things have been tough lately, but I saw a small sign of hope today. A project I thought was a bust got some new life. It’s a reminder that not everything is as bleak as it seems.",
    emotions: ["hopeful", "relieved", "optimistic"],
    mood: 5,
    triggers: ["positive news", "reversals of fortune", "hope"]
  },
  {
    title: "The Simple Things",
    content: "I had a delicious meal that I cooked myself. It was simple but so satisfying. I'm finding joy in these small, everyday moments.",
    emotions: ["content", "grateful", "joyful"],
    mood: 6,
    triggers: ["cooking", "good food", "everyday joys"]
  },
  {
    title: "A Moment of Clarity",
    content: "I was feeling lost, but during a run, a thought popped into my head that gave me a new perspective on a problem I'm facing. It feels like a fog has lifted.",
    emotions: ["clear", "insightful", "focused"],
    mood: 5,
    triggers: ["running", "exercise", "new perspectives"]
  },
  {
    title: "A Beautiful Act",
    content: "I saw someone helping an elderly person cross the street today. It was a beautiful moment of human connection.",
    emotions: ["moved", "inspired", "grateful"],
    mood: 6,
    triggers: ["kindness", "compassion", "positive social interactions"]
  },
  {
    title: "Feeling Unheard",
    content: "I tried to express my feelings to a friend, but they didn't seem to understand. I feel a bit isolated now.",
    emotions: ["lonely", "sad", "frustrated"],
    mood: 2,
    triggers: ["miscommunication", "feeling unheard", "friendship issues"]
  },
  {
    title: "Letting Go",
    content: "I've been holding onto a lot of anger about something that happened a while ago. Today, I'm trying to let it go. It's hard, but I know it's necessary for my own peace of mind.",
    emotions: ["releasing", "calm", "sad"],
    mood: 3,
    triggers: ["anger", "forgiveness", "personal growth"]
  },
  {
    title: "A Productive Morning",
    content: "I woke up early and got so much done before most people are even out of bed. I love the feeling of starting the day with momentum.",
    emotions: ["productive", "energized", "focused"],
    mood: 6,
    triggers: ["morning routine", "productivity", "early wake-up"]
  },
  {
    title: "The Comfort of Routine",
    content: "The world feels a little chaotic right now, but my daily routine is grounding me. It's nice to have a sense of structure and predictability.",
    emotions: ["calm", "safe", "grounded"],
    mood: 5,
    triggers: ["routine", "stability", "uncertain times"]
  },
  {
    title: "An Exciting Opportunity",
    content: "I got an email today about a new project that I'm really excited about. It's a chance to learn and grow, and I can't wait to get started.",
    emotions: ["excited", "motivated", "happy"],
    mood: 7,
    triggers: ["new opportunities", "work projects", "growth"]
  },
  {
    title: "A Day of Rest",
    content: "I spent the entire day doing nothing, and it was wonderful. I read, watched a movie, and just relaxed. It's so important to allow myself these days.",
    emotions: ["relaxed", "refreshed", "calm"],
    mood: 6,
    triggers: ["rest", "self-care", "laziness"]
  },
  {
    title: "The Beauty of Imperfection",
    content: "I tried a new recipe and it didn't turn out perfectly, but it was still delicious. It's a good reminder that perfection isn't the goal—joy and effort are.",
    emotions: ["satisfied", "joyful", "relaxed"],
    mood: 5,
    triggers: ["cooking", "new recipes", "imperfection"]
  },
  {
    title: "A Hard Conversation",
    content: "I had to have a tough conversation with a loved one, but it went better than I expected. We were able to be honest and open with each other.",
    emotions: ["relieved", "connected", "vulnerable"],
    mood: 5,
    triggers: ["difficult conversations", "honesty", "communication"]
  },
  {
    title: "Feeling Uninspired",
    content: "I have a bunch of ideas, but none of them feel good enough. I feel like I'm just going through the motions. I need to find a way to reignite my passion.",
    emotions: ["uninspired", "bored", "disengaged"],
    mood: 2,
    triggers: ["lack of inspiration", "routine", "burnout"]
  },
  {
    title: "A New Beginning",
    content: "I'm starting a new chapter in my life. It's a bit scary, but also exhilarating. I'm excited to see what the future holds.",
    emotions: ["excited", "nervous", "hopeful"],
    mood: 6,
    triggers: ["new beginning", "change", "the future"]
  },
  {
    title: "The Warmth of a Pet",
    content: "My pet cuddled up with me on the couch tonight. Their unconditional love is such a source of comfort.",
    emotions: ["loved", "comforted", "peaceful"],
    mood: 7,
    triggers: ["pets", "cuddles", "unconditional love"]
  },
  {
    title: "A Moment of Solitude",
    content: "I went for a walk by myself and just enjoyed the quiet. I love spending time with others, but I also need these moments to recharge and be with my own thoughts.",
    emotions: ["calm", "solitude", "recharged"],
    mood: 5,
    triggers: ["walking", "alone time", "nature"]
  },
  {
    title: "A Small Act of Kindness",
    content: "I held the door open for someone who was struggling with their groceries. They gave me a warm smile. It was a nice feeling to help someone.",
    emotions: ["compassionate", "helpful", "happy"],
    mood: 6,
    triggers: ["kindness", "helping others", "positive interactions"]
  },
  {
    title: "Dealing with Sadness",
    content: "I'm feeling a bit down today, and I don't really know why. It's a heavy feeling that I can't shake. I'm just going to let myself feel it and not try to force a smile.",
    emotions: ["sad", "heavy", "melancholy"],
    mood: 1,
    triggers: ["unexplained sadness", "emotional low", "difficult day"]
  },
  {
    title: "Finding Inspiration",
    content: "I went to a museum today and felt so inspired by all the art. It made me want to create something beautiful of my own.",
    emotions: ["inspired", "awe", "creative"],
    mood: 6,
    triggers: ["museums", "art", "inspiration"]
  },
  {
    title: "A Sense of Accomplishment",
    content: "I finished a huge project that I've been working on for months. The feeling of finally being done is incredible. I'm so proud of myself.",
    emotions: ["accomplished", "proud", "relieved"],
    mood: 7,
    triggers: ["finishing a project", "hard work", "success"]
  },
  {
    title: "A Quiet Evening In",
    content: "I spent the evening reading and drinking tea. It's so nice to slow down and just be. I'm learning to appreciate these quiet moments.",
    emotions: ["peaceful", "calm", "content"],
    mood: 5,
    triggers: ["reading", "tea", "quiet evening"]
  },
  {
    title: "Feeling Grateful",
    content: "I'm feeling so grateful for my health, my home, and the people in my life. It's easy to focus on what's wrong, but today I'm focusing on what's right.",
    emotions: ["grateful", "blessed", "happy"],
    mood: 7,
    triggers: ["gratitude", "positive thinking", "good health"]
  },
  {
    title: "Overcoming a Fear",
    content: "I did something today that scared me. It was hard, but I did it. I'm so proud of myself for pushing through and facing my fear.",
    emotions: ["brave", "proud", "strong"],
    mood: 6,
    triggers: ["facing fear", "personal challenge", "courage"]
  },
  {
    title: "The Power of a Hug",
    content: "I got a hug from a loved one today, and it made me feel so seen and loved. It's a simple act, but it has so much power.",
    emotions: ["loved", "comforted", "cared for"],
    mood: 7,
    triggers: ["hugs", "loved ones", "physical affection"]
  },
  {
    title: "An Unexpected Challenge",
    content: "I was faced with an unexpected challenge today, and it threw me for a loop. I'm trying to figure out how to navigate it and not let it get the best of me.",
    emotions: ["stressed", "confused", "overwhelmed"],
    mood: 2,
    triggers: ["unexpected problems", "challenges", "stress"]
  },
  {
    title: "A Moment of Connection",
    content: "I had a deep conversation with a friend that went on for hours. It was so nice to connect on such a profound level.",
    emotions: ["connected", "understood", "intimate"],
    mood: 7,
    triggers: ["deep conversations", "friendship", "connection"]
  },
  {
    title: "A Rainy Day",
    content: "The rain today made me feel cozy and reflective. I spent the day inside, listening to the rain fall, and it was so peaceful.",
    emotions: ["peaceful", "cozy", "reflective"],
    mood: 5,
    triggers: ["rainy day", "cozy atmosphere", "reflection"]
  },
  {
    title: "Feeling Grounded",
    content: "I spent the day working in my garden. Putting my hands in the dirt and watching things grow makes me feel so grounded and connected to the earth.",
    emotions: ["grounded", "peaceful", "connected"],
    mood: 6,
    triggers: ["gardening", "nature", "manual labor"]
  },
  {
    title: "The Beauty of a Storm",
    content: "I watched a thunderstorm roll in tonight, and it was so beautiful and powerful. It reminded me that even in chaos, there is a kind of beauty.",
    emotions: ["awe", "intense", "calm"],
    mood: 5,
    triggers: ["thunderstorm", "weather", "nature"]
  },
  {
    title: "A New Idea",
    content: "I had a great idea for a new project today. I'm so excited to start planning and see where it goes.",
    emotions: ["inspired", "excited", "creative"],
    mood: 7,
    triggers: ["new ideas", "creativity", "inspiration"]
  },
  {
    title: "Ending the Day with Gratitude",
    content: "As I wind down for the night, I'm thinking about all the good things that happened today. It wasn't a perfect day, but there were so many small moments of joy.",
    emotions: ["grateful", "content", "peaceful"],
    mood: 6,
    triggers: ["ending the day", "gratitude", "reflection"]
  }
];
const sampleEmotionLogs = [
  {
    emotion: "anxious",
    intensity: 3,
    note: "Feeling nervous about tomorrow's presentation",
    emotions: ["anxious", "nervous", "worried"],
    triggers: ["work presentation", "public speaking"]
  },
  {
    emotion: "grateful",
    intensity: 5,
    note: "Appreciating good health and supportive friends",
    emotions: ["grateful", "thankful", "blessed"],
    triggers: ["health", "friendship", "support"]
  },
  {
    emotion: "excited",
    intensity: 4,
    note: "Looking forward to the weekend adventure",
    emotions: ["excited", "anticipatory", "energetic"],
    triggers: ["weekend plans", "adventure", "travel"]
  },
  {
    emotion: "melancholy",
    intensity: 2,
    note: "Missing old friends and distant memories",
    emotions: ["melancholy", "nostalgic", "wistful"],
    triggers: ["old memories", "distance", "friendship"]
  },
  {
    emotion: "accomplished",
    intensity: 5,
    note: "Completed a challenging workout routine",
    emotions: ["accomplished", "strong", "proud"],
    triggers: ["exercise", "personal achievement", "health goals"]
  },
  {
    emotion: "frustrated",
    intensity: 4,
    note: "Can't figure out this bug in the code. I've been at it for hours.",
    emotions: ["frustrated", "stuck", "annoyed"],
    triggers: ["technical issue", "problem solving", "work"]
  },
  {
    emotion: "calm",
    intensity: 5,
    note: "Spent the morning reading with a cup of tea. It was so peaceful.",
    emotions: ["calm", "peaceful", "relaxed"],
    triggers: ["reading", "tea", "quiet time"]
  },
  {
    emotion: "joyful",
    intensity: 5,
    note: "My dog greeted me at the door with so much excitement. It's the highlight of my day.",
    emotions: ["joyful", "happy", "loved"],
    triggers: ["pet", "coming home", "unconditional love"]
  },
  {
    emotion: "stressed",
    intensity: 4,
    note: "Feeling overwhelmed by the sheer number of deadlines this week.",
    emotions: ["stressed", "overwhelmed", "anxious"],
    triggers: ["deadlines", "workload", "time pressure"]
  },
  {
    emotion: "content",
    intensity: 4,
    note: "A nice dinner and a good conversation with a friend. I feel content.",
    emotions: ["content", "satisfied", "happy"],
    triggers: ["dinner", "friendship", "good conversation"]
  },
  {
    emotion: "lonely",
    intensity: 3,
    note: "My friends are busy tonight, so I'm home alone. Feeling a bit isolated.",
    emotions: ["lonely", "isolated", "sad"],
    triggers: ["alone time", "social plans", "being home"]
  },
  {
    emotion: "inspired",
    intensity: 4,
    note: "Listened to a powerful podcast about creative pursuits. I have so many new ideas.",
    emotions: ["inspired", "motivated", "creative"],
    triggers: ["podcast", "new ideas", "creativity"]
  },
  {
    emotion: "tired",
    intensity: 5,
    note: "Just finished a long day of travel. I'm completely exhausted.",
    emotions: ["tired", "exhausted", "drained"],
    triggers: ["travel", "long day", "physical exertion"]
  },
  {
    emotion: "proud",
    intensity: 5,
    note: "I stood up for myself in a difficult conversation. It felt good to set a boundary.",
    emotions: ["proud", "strong", "confident"],
    triggers: ["standing up for self", "difficult conversation", "boundaries"]
  },
  {
    emotion: "bored",
    intensity: 2,
    note: "Nothing to do on a lazy Sunday. Just scrolling on my phone.",
    emotions: ["bored", "dull", "unmotivated"],
    triggers: ["weekend", "lack of plans", "laziness"]
  },
  {
    emotion: "disappointed",
    intensity: 4,
    note: "The concert I was looking forward to was canceled. I'm so bummed.",
    emotions: ["disappointed", "sad", "upset"],
    triggers: ["canceled plans", "concert", "high expectations"]
  },
  {
    emotion: "hopeful",
    intensity: 4,
    note: "Just sent in my application for a new job. Fingers crossed!",
    emotions: ["hopeful", "optimistic", "eager"],
    triggers: ["job application", "new opportunities", "the future"]
  },
  {
    emotion: "angry",
    intensity: 3,
    note: "Someone cut me off in traffic, and it really set me off. The frustration lingered.",
    emotions: ["angry", "irritated", "annoyed"],
    triggers: ["traffic", "frustration", "daily commute"]
  },
  {
    emotion: "sympathetic",
    intensity: 4,
    note: "Heard some bad news about a friend's family. My heart goes out to them.",
    emotions: ["sympathetic", "empathetic", "concerned"],
    triggers: ["friend's news", "bad news", "empathy"]
  },
  {
    emotion: "surprised",
    intensity: 4,
    note: "My family threw a surprise party for my birthday! I had no idea.",
    emotions: ["surprised", "shocked", "happy"],
    triggers: ["surprise party", "birthday", "celebration"]
  },
  {
    emotion: "calm",
    intensity: 5,
    note: "Took a walk in the park. The fresh air and sunshine are so calming.",
    emotions: ["calm", "peaceful", "serene"],
    triggers: ["nature", "walking", "sunshine"]
  },
  {
    emotion: "confused",
    intensity: 3,
    note: "Trying to understand a complex new policy at work. I feel a bit lost.",
    emotions: ["confused", "puzzled", "uncertain"],
    triggers: ["new policy", "work information", "learning curve"]
  },
  {
    emotion: "energetic",
    intensity: 5,
    note: "After a great workout and a healthy meal, I feel ready to take on the world.",
    emotions: ["energetic", "motivated", "alive"],
    triggers: ["workout", "healthy eating", "feeling well"]
  },
  {
    emotion: "grief",
    intensity: 4,
    note: "Anniversary of a family member's passing. Feeling the weight of the loss today.",
    emotions: ["sad", "grief", "loss"],
    triggers: ["anniversary", "death of a loved one", "memory"]
  },
  {
    emotion: "curious",
    intensity: 3,
    note: "Started a new documentary series. I'm fascinated by the subject matter.",
    emotions: ["curious", "interested", "intrigued"],
    triggers: ["documentary", "new information", "learning"]
  },
  {
    emotion: "relieved",
    intensity: 5,
    note: "Finally submitted a big report that was due today. The pressure is off.",
    emotions: ["relieved", "relaxed", "peaceful"],
    triggers: ["deadline met", "work done", "submission"]
  },
  {
    emotion: "amused",
    intensity: 4,
    note: "Watched a hilarious stand-up comedy special tonight. I was laughing so hard.",
    emotions: ["amused", "joyful", "happy"],
    triggers: ["comedy", "entertainment", "laughter"]
  },
  {
    emotion: "shame",
    intensity: 2,
    note: "Made a silly mistake during a meeting. Feeling a little embarrassed.",
    emotions: ["shame", "embarrassed", "regret"],
    triggers: ["mistake at work", "social situation", "self-criticism"]
  },
  {
    emotion: "secure",
    intensity: 5,
    note: "My partner and I had a talk about our future. I feel so secure and happy with them.",
    emotions: ["secure", "loved", "content"],
    triggers: ["relationship", "future planning", "emotional security"]
  },
  {
    emotion: "disgusted",
    intensity: 3,
    note: "Saw some political news that was particularly offensive. I'm feeling disgusted by it.",
    emotions: ["disgusted", "appalled", "angry"],
    triggers: ["news", "politics", "offensive content"]
  },
  {
    emotion: "focused",
    intensity: 4,
    note: "I'm in a deep work session, and the words are just flowing. I'm in the zone.",
    emotions: ["focused", "productive", "in the zone"],
    triggers: ["deep work", "writing", "concentration"]
  },
  {
    emotion: "vulnerable",
    intensity: 3,
    note: "Opened up to a new friend about something personal. It was scary but good.",
    emotions: ["vulnerable", "brave", "open"],
    triggers: ["personal conversation", "new friendship", "sharing"]
  },
  {
    emotion: "overwhelmed",
    intensity: 5,
    note: "The kids' schedule, work, and household chores are all piling up. I don't know how I'll get it all done.",
    emotions: ["overwhelmed", "stressed", "anxious"],
    triggers: ["family duties", "multitasking", "workload"]
  },
  {
    emotion: "satisfied",
    intensity: 4,
    note: "Had a great meal that I cooked from scratch. It was a perfect ending to the day.",
    emotions: ["satisfied", "content", "joyful"],
    triggers: ["cooking", "good food", "personal achievement"]
  },
  {
    emotion: "bored",
    intensity: 2,
    note: "Just finished a book and can't find anything new to read. Feeling a bit listless.",
    emotions: ["bored", "listless", "unstimulated"],
    triggers: ["reading", "lack of new content", "downtime"]
  },
  {
    emotion: "calm",
    intensity: 5,
    note: "The sound of rain outside is so soothing. I love days like this.",
    emotions: ["calm", "peaceful", "cozy"],
    triggers: ["rain", "weather", "cozy atmosphere"]
  },
  {
    emotion: "elated",
    intensity: 5,
    note: "Got a call from a long-lost friend. I haven't talked to them in years!",
    emotions: ["elated", "joyful", "surprised"],
    triggers: ["reconnecting with friends", "unexpected call", "happy memories"]
  },
  {
    emotion: "sad",
    intensity: 3,
    note: "Thinking about my childhood pet that passed away. Still miss them.",
    emotions: ["sad", "nostalgic", "grief"],
    triggers: ["childhood memories", "pets", "loss"]
  },
  {
    emotion: "adventurous",
    intensity: 4,
    note: "Planning a hiking trip for next month. I'm excited to explore new trails.",
    emotions: ["adventurous", "excited", "eager"],
    triggers: ["hiking", "travel planning", "nature"]
  },
  {
    emotion: "disgusted",
    intensity: 4,
    note: "The news about the environmental damage is so disheartening. I feel helpless.",
    emotions: ["disgusted", "helpless", "sad"],
    triggers: ["news", "environmental issues", "politics"]
  },
  {
    emotion: "proud",
    intensity: 5,
    note: "My child got an award at school today. I'm so incredibly proud of them.",
    emotions: ["proud", "happy", "loved"],
    triggers: ["child's achievement", "school", "parenting"]
  },
  {
    emotion: "hopeful",
    intensity: 5,
    note: "The weather forecast for this weekend is beautiful. I'm looking forward to being outside.",
    emotions: ["hopeful", "optimistic", "happy"],
    triggers: ["weather forecast", "weekend plans", "outdoor activities"]
  },
  {
    emotion: "lonely",
    intensity: 4,
    note: "I went to a social gathering and felt like an outsider. It was a tough night.",
    emotions: ["lonely", "isolated", "social anxiety"],
    triggers: ["social gathering", "feeling left out", "crowds"]
  },
  {
    emotion: "grateful",
    intensity: 5,
    note: "My partner made me breakfast in bed. Such a sweet gesture. I'm so thankful.",
    emotions: ["grateful", "loved", "thankful"],
    triggers: ["kind gestures", "partner", "breakfast in bed"]
  },
  {
    emotion: "frustrated",
    intensity: 3,
    note: "Trying to assemble some new furniture and the instructions are impossible to follow.",
    emotions: ["frustrated", "annoyed", "impatient"],
    triggers: ["furniture assembly", "bad instructions", "DIY projects"]
  },
  {
    emotion: "relaxed",
    intensity: 5,
    note: "Just finished a yoga class. My mind and body feel completely at ease.",
    emotions: ["relaxed", "calm", "peaceful"],
    triggers: ["yoga", "exercise", "meditation"]
  },
  {
    emotion: "disappointed",
    intensity: 3,
    note: "My favorite sports team lost a big game. It's a bummer.",
    emotions: ["disappointed", "sad", "upset"],
    triggers: ["sports", "losing a game", "high hopes"]
  },
  {
    emotion: "joyful",
    intensity: 5,
    note: "Saw a group of kids playing and laughing without a care in the world. It was a pure moment of joy.",
    emotions: ["joyful", "happy", "amused"],
    triggers: ["children", "laughter", "innocence"]
  },
  {
    emotion: "anxious",
    intensity: 4,
    note: "I have a flight tomorrow and the thought of flying is making me nervous.",
    emotions: ["anxious", "nervous", "scared"],
    triggers: ["flying", "travel", "fear"]
  },
  {
    emotion: "content",
    intensity: 4,
    note: "Just finished a great book and I'm feeling so satisfied with the ending.",
    emotions: ["content", "satisfied", "happy"],
    triggers: ["reading", "books", "story completion"]
  }
];

// Helper function to get random date within last 30 days
function getRandomRecentDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime);
}

// Create sample moments
async function createSampleMoments(db, userId) {
  console.log(`Creating sample journal moments for user: ${userId}`);
  
  const journalPromises = sampleJournalEntries.map(async (entry, index) => {
    const momentData = {
      userId,
      type: 'journal',
      title: entry.title,
      content: entry.content,
      timestamp: Timestamp.fromDate(getRandomRecentDate()),
      mood: entry.mood,
      emotions: entry.emotions,
      triggers: entry.triggers,
      journalData: {
        entryType: 'text',
        isDraft: false,
        wordCount: entry.content.split(' ').length,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = await db.collection('moments').add(momentData);
      console.log(`✅ Created journal moment: ${entry.title} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating journal moment ${entry.title}:`, error);
      return null;
    }
  });

  const emotionPromises = sampleEmotionLogs.map(async (emotion, index) => {
    const momentData = {
      userId,
      type: 'emotion',
      content: `${emotion.emotion}: ${emotion.note}`,
      timestamp: Timestamp.fromDate(getRandomRecentDate()),
      mood: emotion.intensity,
      emotions: emotion.emotions,
      triggers: emotion.triggers,
      emotionData: {
        primaryEmotion: emotion.emotion,
        intensity: emotion.intensity,
        note: emotion.note,
        context: 'daily_reflection',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = await db.collection('moments').add(momentData);
      console.log(`✅ Created emotion moment: ${emotion.emotion} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating emotion moment ${emotion.emotion}:`, error);
      return null;
    }
  });

  const results = await Promise.all([...journalPromises, ...emotionPromises]);
  const successCount = results.filter(id => id !== null).length;
  
  console.log(`\n🎉 Successfully created ${successCount} sample moments!`);
  return results.filter(id => id !== null);
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting sample data population...\n');
    
    const db = initializeFirebase();
    const userId = '49zJgAemfAhzNYEwsulvufWIWUC3';
    
    // Check if user already has moments
    const existingMoments = await db.collection('moments')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!existingMoments.empty) {
      console.log(`⚠️  User ${userId} already has moments. Continuing anyway...\n`);
    }
    
    const momentIds = await createSampleMoments(db, userId);
    
    console.log('\n📊 Summary:');
    console.log(`- User ID: ${userId}`);
    console.log(`- Total moments created: ${momentIds.length}`);
    console.log(`- Journal entries: ${sampleJournalEntries.length}`);
    console.log(`- Emotion logs: ${sampleEmotionLogs.length}`);
    
    console.log('\n✅ Sample data population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during sample data population:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createSampleMoments };