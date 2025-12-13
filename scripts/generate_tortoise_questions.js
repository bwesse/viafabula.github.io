const fs = require('fs');
const path = require('path');

const levelTiers = {
  beginner: ['a0', 'a1', 'a2'],
  intermediate: ['b1', 'b2'],
  advanced: ['c1', 'c2', 'native', 'original'],
};

const chapters = [
  '00_preamble',
  '01_A_Boastful_Runner',
  '02_A_Quiet_Challenge',
  '03_The_Forest_Gathers',
  '04_At_the_Starting_Line',
  '05_The_Race_Begins',
  '06_Overconfidence',
  '07Steady_Progress',
  '08_A_Sudden_Awakening',
  '09_The_Final_Stride',
  '10_Lesson_of_the_Day',
  '11_A_New_Understanding',
  '12_The_Enduring_Moral',
];

const data = {
  english: {
    '00_preamble': {
      beginner: [
        {
          id: 'q1',
          question: 'How long are these stories?',
          options: ['Short', 'Very long', 'Hard to finish'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Where can you read them?',
          options: ['On any device', 'Only in a book', 'Only at school'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What do the stories still have?',
          options: ['Meaning', 'Music', 'Pictures only'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Why are the chapters kept brief?',
          options: [
            'So one screen can hold a whole page',
            'To leave out important details',
            'To hide the main ideas',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What balance does the collection aim for?',
          options: [
            'Simple reading with real meaning',
            'Complicated wording for experts',
            'Only fast action and no message',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What does the first fable introduce?',
          options: [
            'Themes of confidence, patience, and determination',
            'A list of grammar rules',
            'Instructions on how to run a race',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What kind of reading experience do the short chapters invite?',
          options: [
            'Finishing a scene in a single sitting on any screen',
            'Jumping between unrelated stories',
            'Skipping reflection to rush ahead',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the opening tale set the tone for the rest?',
          options: [
            'It models concise scenes with clear themes',
            'It delays the moral until the final book',
            'It focuses only on action without meaning',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What dual purpose do these stories claim to serve?',
          options: [
            'To be both companions and guides for learners',
            'To replace all grammar study',
            'To compete with long novels',
          ],
          correctIndex: 0,
        },
      ],
    },
    '01_A_Boastful_Runner': {
      beginner: [
        {
          id: 'q1',
          question: 'Who runs very fast?',
          options: ['The Hare', 'The Fox', 'The Tortoise'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does the Hare do to others?',
          options: ['He boasts and laughs', 'He hides quietly', 'He asks for help'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What do the animals wonder?',
          options: ['If anyone can beat him', 'If the race is canceled', 'If the day is over'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'How does the Hare show his arrogance?',
          options: [
            'By bragging and mocking slower friends',
            'By training quietly every day',
            'By refusing to run at all',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What do the forest animals keep asking themselves?',
          options: [
            'Whether anyone could possibly beat him',
            'How to stop the race',
            'Why the Fox is late',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What effect does the Hare’s daily boasting have?',
          options: [
            'His arrogance grows with each victory',
            'He becomes humbler with time',
            'He forgets how fast he is',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the Hare’s behavior turn admiration into irritation?',
          options: [
            'His constant boasting overshadows his talent',
            'His silence confuses the forest',
            'His injuries stop the races',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does claiming he can outrun time reveal about him?',
          options: [
            'His hubris and sense of invincibility',
            'His fear of losing speed',
            'His respect for the Tortoise',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the narration hint that a challenge is coming?',
          options: [
            'By noting that others quietly wonder about his limits',
            'By saying the forest has no other racers',
            'By ending the story right away',
          ],
          correctIndex: 0,
        },
      ],
    },
    '02_A_Quiet_Challenge': {
      beginner: [
        {
          id: 'q1',
          question: 'Who challenges the Hare?',
          options: ['The Tortoise', 'The Fox', 'The Bird'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the forest react?',
          options: ['It becomes quiet', 'It starts to dance', 'It leaves the path'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How is the Tortoise described?',
          options: ['Calm', 'Angry', 'Sleepy'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What prompts the Tortoise to speak?',
          options: [
            'He hears the Hare boasting',
            'The Fox orders him to race',
            'The crowd pushes him forward',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Why does the forest fall silent?',
          options: [
            'A slow racer challenges the fastest animal',
            'The race is canceled',
            'The weather turns stormy',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What quality does the Tortoise show in his challenge?',
          options: ['Calm confidence', 'Loud anger', 'Fearful doubt'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What makes the Tortoise’s challenge powerful despite few words?',
          options: [
            'His steady tone and simple promise to race',
            'An angry speech about fairness',
            'A bargain for a shorter course',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Why does the forest’s silence matter in this scene?',
          options: [
            'It shows how unexpected the challenger is',
            'It proves no one cares about the race',
            'It means the race cannot happen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does this moment reframe confidence?',
          options: [
            'It contrasts quiet resolve with loud arrogance',
            'It proves speed always wins',
            'It suggests the Fox controls everything',
          ],
          correctIndex: 0,
        },
      ],
    },
    '03_The_Forest_Gathers': {
      beginner: [
        {
          id: 'q1',
          question: 'What do the animals do when they hear about the race?',
          options: ['They go to the path', 'They go to sleep', 'They hide at home'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Who do most think will win?',
          options: ['The Hare', 'The Tortoise', 'The Fox'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Who waits ready to start?',
          options: ['Both the Tortoise and the Hare', 'Only the Fox', 'Only the birds'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Why do birds, squirrels, and others gather?',
          options: [
            'Curiosity draws them to see the race',
            'They need to cross the path',
            'They want to stop the race',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What expectation do most animals carry?',
          options: [
            'That the Hare will win easily',
            'That the race will never start',
            'That the Fox will run instead',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Why do they still want to watch?',
          options: [
            'They want to witness the story unfold',
            'They hope the race is canceled',
            'They need to count the steps',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What mood settles over the crowd as they gather?',
          options: [
            'Curious anticipation of a likely outcome',
            'Boredom and disinterest',
            'Fear that the race is dangerous',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does having witnesses raise the stakes of the race?',
          options: [
            'Everyone will remember what truly happens',
            'It shortens the course for the runners',
            'It guarantees the Hare will relax',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What tension exists between their expectation and their actions?',
          options: [
            'They assume the Hare wins yet still watch closely',
            'They think the Fox might cheat but ignore him',
            'They believe the Tortoise will not show up',
          ],
          correctIndex: 0,
        },
      ],
    },
    '04_At_the_Starting_Line': {
      beginner: [
        {
          id: 'q1',
          question: 'Who draws the start line?',
          options: ['The Fox', 'The Hare', 'The Bird'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How is the Tortoise?',
          options: ['Calm and ready', 'Angry and loud', 'Sleeping'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What do the animals do?',
          options: ['Watch and wait', 'Run away', 'Go home'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What role does the Fox play before the race starts?',
          options: [
            'He marks the starting line and hosts the start',
            'He runs beside the racers',
            'He bets on the winner',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How do the two racers differ in attitude at the line?',
          options: [
            'The Tortoise is calm; the Hare bounces with energy',
            'Both are angry and shouting',
            'Both try to hide from the crowd',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How is the crowd behaving at this moment?',
          options: [
            'They are watching quietly for the signal',
            'They are already celebrating the winner',
            'They are leaving the path',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What does the Fox’s task suggest about fairness?',
          options: [
            'A neutral start line keeps the race orderly',
            'He is secretly helping the Hare',
            'He wants to stop the event',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How do the racers’ mindsets contrast right before the signal?',
          options: [
            'Composed steadiness versus eager impatience',
            'Equal boredom with the race',
            'Shared fear of the crowd',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does collective anticipation shape the start?',
          options: [
            'The silent crowd builds tension for the first step',
            'Noise from the crowd distracts the racers',
            'No one pays attention to the moment',
          ],
          correctIndex: 0,
        },
      ],
    },
    '05_The_Race_Begins': {
      beginner: [
        {
          id: 'q1',
          question: 'Who shouts “Go”?',
          options: ['The Fox', 'The Tortoise', 'The Owl'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Who runs fast and disappears?',
          options: ['The Hare', 'The Tortoise', 'The Fox'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the Tortoise move?',
          options: ['Slow and steady', 'He jumps high', 'He stops and sits'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'How does the race start?',
          options: [
            'With the Fox calling the signal',
            'With the Hare deciding alone',
            'With no one marking the time',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How do the racers move differently at the start?',
          options: [
            'The Hare sprints away while the Tortoise takes steady steps',
            'Both crawl slowly',
            'Both sit down to rest',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Why are the animals cheering?',
          options: [
            'They are excited to see the race underway',
            'They want the race to stop',
            'They are cheering for a different game',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the opening sprint set up the story’s contrast?',
          options: [
            'The Hare vanishes in speed while the Tortoise chooses consistency',
            'Both racers show equal speed and effort',
            'The Fox refuses to start the race',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Why is the Fox’s shout important?',
          options: [
            'It gives a clear, fair start with no excuses',
            'It scares the racers into stopping',
            'It ends the competition early',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What early contrast hints at the later outcome?',
          options: [
            'Speed without steadiness versus steadiness without speed',
            'A lack of spectators',
            'Both racers ignoring the course',
          ],
          correctIndex: 0,
        },
      ],
    },
    '06_Overconfidence': {
      beginner: [
        {
          id: 'q1',
          question: 'What does the Hare think?',
          options: ['He has already won', 'He might lose', 'He is lost'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does the Hare do?',
          options: ['He sleeps on warm grass', 'He runs harder', 'He leaves the race'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What does the Tortoise do?',
          options: ['Keeps walking', 'Stops to sleep', 'Runs back home'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What mistake does the Hare make?',
          options: [
            'He assumes victory and lies down to sleep',
            'He takes the wrong path',
            'He gives up and leaves the course',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What keeps the Tortoise moving?',
          options: [
            'Steady focus on the course',
            'Fear of the crowd',
            'Chasing the Fox',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What does the warm grass represent for the Hare?',
          options: [
            'Comfort that leads to complacency',
            'A place to hide from the Tortoise',
            'A mark that the race is finished',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the Hare misread the silence behind him?',
          options: [
            'He treats it as proof that the race is decided',
            'He fears a storm is coming',
            'He thinks the path has ended',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does his nap symbolize?',
          options: [
            'Complacency born from unchecked confidence',
            'A planned strategy to slow the Tortoise',
            'Careful time management',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the Tortoise’s movement counter the Hare’s pause?',
          options: [
            'Continuous progress replaces wasted speed',
            'He also decides to sleep',
            'He waits for the Hare to wake up',
          ],
          correctIndex: 0,
        },
      ],
    },
    '07Steady_Progress': {
      beginner: [
        {
          id: 'q1',
          question: 'Who keeps walking with the same slow steps?',
          options: ['The Tortoise', 'The Hare', 'The Fox'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Who is still sleeping?',
          options: ['The Hare', 'The Tortoise', 'The crowd'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Does the Tortoise stop?',
          options: ['No, he keeps going', 'Yes, he sleeps', 'Yes, he runs back'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'How does the Tortoise advance along the path?',
          options: [
            'With constant, steady steps',
            'By sprinting in bursts',
            'By leaving the path',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What key moment happens while the Hare sleeps?',
          options: [
            'The Tortoise quietly passes him',
            'The Fox ends the race',
            'The crowd leaves',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What does not stopping show about the Tortoise?',
          options: ['His discipline and perseverance', 'His fear of the Hare', 'His need for a map'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What is significant about the Tortoise passing the sleeping Hare?',
          options: [
            'Persistence overtakes talent when talent rests',
            'The race officially ends there',
            'The Fox disqualifies the Hare',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does steady pacing function as a strategy here?',
          options: [
            'It removes risk from pauses or bursts',
            'It hides his position from the crowd',
            'It depends on surprising shortcuts',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What emotion is notably absent from the Tortoise’s advance?',
          options: ['Gloating', 'Joy', 'Hope'],
          correctIndex: 0,
        },
      ],
    },
    '08_A_Sudden_Awakening': {
      beginner: [
        {
          id: 'q1',
          question: 'What wakes the Hare?',
          options: ['A wind in the leaves', 'A shout from the Fox', 'A loud bell'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does he see when he wakes?',
          options: ['The Tortoise near the finish', 'No one on the path', 'Rain stopping the race'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What does the Hare do then?',
          options: ['He jumps up and runs fast', 'He goes back to sleep', 'He quits the race'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What triggers the Hare’s awakening?',
          options: [
            'Wind moving the leaves around him',
            'The Fox shaking him',
            'Thunder and lightning',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How close is the Tortoise when the Hare looks up?',
          options: [
            'Very near the finish line',
            'Still far behind',
            'Sitting beside him',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the Hare respond to what he sees?',
          options: [
            'He sprints in a panic',
            'He calmly waits',
            'He asks to delay the race',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the environment create the turning point of this chapter?',
          options: [
            'A gust of wind wakes the Hare and ends his complacency',
            'The Fox calls off the race',
            'The path suddenly ends',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does the Hare’s reaction reveal about his awareness?',
          options: [
            'He realizes too late how close the finish is',
            'He still assumes he cannot lose',
            'He wants to restart the race',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the Tortoise’s position change the race dynamic?',
          options: [
            'With so little distance left, the Hare has almost no time to recover',
            'It forces the Fox to shorten the course',
            'It means the Tortoise must stop and wait',
          ],
          correctIndex: 0,
        },
      ],
    },
    '09_The_Final_Stride': {
      beginner: [
        {
          id: 'q1',
          question: 'Who reaches the line first?',
          options: ['The Tortoise', 'The Hare', 'The Fox'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What does the forest do?',
          options: ['Cheers for the winner', 'Goes home', 'Stops the race'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Can the Hare catch up in time?',
          options: ['No, he is too late', 'Yes, he wins', 'He quits before the end'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Why can’t the Hare win even though he runs fast?',
          options: [
            'The Tortoise is already at the finish',
            'The Fox blocks his path',
            'He injures his leg',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What do the cheers celebrate?',
          options: [
            'Perseverance rather than raw speed',
            'The Fox’s starting line',
            'The race being canceled',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What lesson is reinforced at the finish?',
          options: [
            'Steady effort can beat a late sprint',
            'Speed always wins',
            'Sleep helps you win races',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'What does the outcome ultimately celebrate?',
          options: [
            'Perseverance that sustains effort to the end',
            'A lucky stumble by the Hare',
            'The Fox’s clever tricks',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the Hare’s sprint underline the story’s message?',
          options: [
            'Urgency that comes too late cannot erase earlier complacency',
            'It proves he was the true winner',
            'It shows the crowd favored speed',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Why do the cheers focus on perseverance instead of speed?',
          options: [
            'The community values effort that never stopped',
            'They did not see the Hare running',
            'They dislike fast animals',
          ],
          correctIndex: 0,
        },
      ],
    },
    '10_Lesson_of_the_Day': {
      beginner: [
        {
          id: 'q1',
          question: 'How does the Hare feel after the race?',
          options: ['Tired and sad', 'Excited and happy', 'Hungry and calm'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the Tortoise act?',
          options: ['He smiles kindly', 'He laughs at the Hare', 'He runs away'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What lesson do the forest animals learn?',
          options: [
            'Slow and steady can win',
            'Sleeping wins races',
            'Only speed matters',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'How is the Hare described after losing?',
          options: [
            'Tired and regretful',
            'Angry and shouting',
            'Proud and laughing',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the Tortoise treat the Hare?',
          options: [
            'With kindness instead of boasting',
            'By mocking his mistake',
            'By ignoring him completely',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What lesson does the forest take from the race?',
          options: [
            'Steady effort can beat speed alone',
            'Speed is the only thing that counts',
            'Every race should end in a tie',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the Tortoise’s kindness shape the moral?',
          options: [
            'It turns the victory into a lesson in humility, not humiliation',
            'It hides the fact that he won',
            'It suggests the race was unfair',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What central lesson does the forest name?',
          options: [
            'Steadiness can triumph over careless speed',
            'Resting is always the best plan',
            'Challenges should be avoided',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How does the Hare’s exhaustion connect to his earlier choice?',
          options: [
            'His overconfidence led to a tiring chase at the end',
            'He trained too hard before the race',
            'He carried the Tortoise for part of the path',
          ],
          correctIndex: 0,
        },
      ],
    },
    '11_A_New_Understanding': {
      beginner: [
        {
          id: 'q1',
          question: 'What does the Hare learn?',
          options: ['To respect others', 'To sleep more', 'To stop running'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Who is praised for being steady?',
          options: ['The Tortoise', 'The Fox', 'The Owl'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What happens to their race story?',
          options: [
            'It becomes a lesson for everyone',
            'It is forgotten',
            'It turns into a different story',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What change takes place in the Hare?',
          options: [
            'He gains respect for others',
            'He decides never to race again',
            'He blames the Fox for losing',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How is the Tortoise viewed by the forest?',
          options: [
            'He is praised for steady effort',
            'He is ignored after the race',
            'He is asked to slow down more',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How do friends use the story later?',
          options: [
            'They remember it when they want to give up',
            'They use it to mock slow runners',
            'They avoid talking about it again',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'How does the Hare’s new respect mark his growth?',
          options: [
            'It replaces arrogance with humility',
            'It proves he no longer cares about racing',
            'It shows he wants revenge',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the community regard the Tortoise now?',
          options: [
            'As an example of steady discipline',
            'As a lucky winner',
            'As someone who should stop racing',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'In what way does the story function after the race?',
          options: [
            'As a shared reminder whenever perseverance feels hard',
            'As a warning not to try new things',
            'As a secret kept from newcomers',
          ],
          correctIndex: 0,
        },
      ],
    },
    '12_The_Enduring_Moral': {
      beginner: [
        {
          id: 'q1',
          question: 'What do the animals remember?',
          options: ['The race', 'A song', 'A storm'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'What phrase do they repeat?',
          options: [
            '"Slow and steady can win"',
            '"Sleeping is best"',
            '"Speed is always first"',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What quality lasts?',
          options: ['Patience', 'Laziness', 'Anger'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'What part of the story stays in the forest’s memory?',
          options: [
            'The race and its lesson',
            'Only the starting line',
            'Only the Hare’s nap',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How do they describe the main moral?',
          options: [
            'Slow and steady can win',
            'Speed always wins',
            'No one should race again',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'How is patience compared to speed?',
          options: [
            'Speed is good, but patience lasts',
            'Patience is useless in races',
            'Speed and patience are the same',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Why does this moral endure in the forest?',
          options: [
            'Its lesson about patience and steady effort remains useful',
            'It is the only story they know',
            'It changes every time it is told',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'How does the story contrast speed and patience?',
          options: [
            'Speed helps, but patience is lasting',
            'Patience is unnecessary when you are fast',
            'Speed and patience both fade quickly',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'What keeps the tale alive over time?',
          options: [
            'It is retold so the lesson is not forgotten',
            'It is written in secret code',
            'It is locked away in a box',
          ],
          correctIndex: 0,
        },
      ],
    },
  },
  spanish: {
    '00_preamble': {
      beginner: [
        {
          id: 'q1',
          question: '¿Cómo son estas historias?',
          options: ['Cortas', 'Muy largas', 'Difíciles de terminar'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Dónde puedes leerlas?',
          options: ['En cualquier dispositivo', 'Solo en un libro', 'Solo en la escuela'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué mantienen las historias?',
          options: ['Significado', 'Solo música', 'Solo dibujos'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Por qué los capítulos son breves?',
          options: [
            'Para que una sola pantalla muestre la página',
            'Para quitar ideas importantes',
            'Para esconder el mensaje',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué equilibrio busca la colección?',
          options: [
            'Lectura simple con verdadero sentido',
            'Palabras complicadas para expertos',
            'Solo acción rápida sin mensaje',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué presenta la primera fábula?',
          options: [
            'Temas de confianza, paciencia y constancia',
            'Una lista de reglas de gramática',
            'Instrucciones para correr una carrera',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Qué tipo de lectura invitan los capítulos cortos?',
          options: [
            'Terminar una escena en una sola sesión y pantalla',
            'Saltar entre historias sin conexión',
            'Apurar la lectura sin pensar',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo marca el tono el primer relato?',
          options: [
            'Modela escenas concisas con temas claros',
            'Retrasa la moraleja hasta el último libro',
            'Se enfoca solo en la acción sin sentido',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué doble propósito dicen tener estas historias?',
          options: [
            'Ser compañía y guía para quien aprende',
            'Reemplazar todo estudio de gramática',
            'Competir con novelas muy largas',
          ],
          correctIndex: 0,
        },
      ],
    },
    '01_A_Boastful_Runner': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién corre muy rápido?',
          options: ['La Liebre', 'El Zorro', 'La Tortuga'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué hace la Liebre con los demás?',
          options: ['Presume y se ríe', 'Se esconde en silencio', 'Pide ayuda'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué se preguntan los animales?',
          options: ['Si alguien puede ganarle', 'Si la carrera se cancela', 'Si ya terminó el día'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Cómo muestra la Liebre su arrogancia?',
          options: [
            'Presumiendo y burlándose de los lentos',
            'Entrenando en silencio cada día',
            'Negándose a correr',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué se preguntan los animales del bosque?',
          options: [
            'Si alguien podría vencerlo',
            'Cómo detener la carrera',
            'Por qué el Zorro llega tarde',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué efecto tiene presumir todos los días?',
          options: [
            'Su arrogancia crece con cada victoria',
            'Se vuelve más humilde',
            'Olvida que es rápido',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo convierte la Liebre la admiración en molestia?',
          options: [
            'Su constante alarde tapa su talento',
            'Su silencio confunde al bosque',
            'Sus heridas detienen las carreras',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué revela afirmar que puede vencer al tiempo?',
          options: [
            'Su soberbia y sensación de invencible',
            'Su miedo a perder velocidad',
            'Su respeto por la Tortuga',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo insinúa el relato que llegará un reto?',
          options: [
            'Dice que otros se preguntan en silencio por sus límites',
            'Asegura que no hay otros corredores',
            'Termina la historia de inmediato',
          ],
          correctIndex: 0,
        },
      ],
    },
    '02_A_Quiet_Challenge': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién reta a la Liebre?',
          options: ['La Tortuga', 'El Zorro', 'El Pájaro'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo reacciona el bosque?',
          options: ['Queda en silencio', 'Empieza a bailar', 'Se aleja del camino'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo describen a la Tortuga?',
          options: ['Tranquila', 'Enojada', 'Con sueño'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué hace hablar a la Tortuga?',
          options: [
            'Escucha presumir a la Liebre',
            'El Zorro la obliga a correr',
            'La empuja la multitud',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Por qué el bosque queda callado?',
          options: [
            'Un corredor lento reta al más rápido',
            'La carrera se cancela',
            'El clima se vuelve tormentoso',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué muestra la Tortuga al retar?',
          options: ['Confianza tranquila', 'Furia ruidosa', 'Duda con miedo'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Por qué es fuerte el reto de la Tortuga con tan pocas palabras?',
          options: [
            'Por su tono sereno y promesa simple',
            'Por un discurso airado sobre justicia',
            'Por pedir una pista más corta',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Por qué importa el silencio del bosque?',
          options: [
            'Muestra lo inesperado del retador',
            'Prueba que nadie quiere la carrera',
            'Significa que no habrá carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo cambia esta escena la idea de confianza?',
          options: [
            'Contrasta la calma silenciosa con la arrogancia ruidosa',
            'Prueba que la velocidad siempre gana',
            'Sugiere que el Zorro manda en todo',
          ],
          correctIndex: 0,
        },
      ],
    },
    '03_The_Forest_Gathers': {
      beginner: [
        {
          id: 'q1',
          question: '¿Qué hacen los animales al oír de la carrera?',
          options: ['Van al camino', 'Se duermen', 'Se esconden en casa'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Quién creen que ganará la mayoría?',
          options: ['La Liebre', 'La Tortuga', 'El Zorro'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Quiénes esperan listos para empezar?',
          options: ['La Tortuga y la Liebre', 'Solo el Zorro', 'Solo los pájaros'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Por qué se reúnen pájaros, ardillas y otros?',
          options: [
            'La curiosidad los lleva a ver la carrera',
            'Necesitan cruzar el camino',
            'Quieren detener la carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué esperan la mayoría de los animales?',
          options: [
            'Que la Liebre gane sin problema',
            'Que la carrera nunca empiece',
            'Que el Zorro corra en su lugar',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Por qué aun así quieren mirar?',
          options: [
            'Quieren ver cómo se cuenta la historia',
            'Esperan que la carrera se cancele',
            'Necesitan contar los pasos',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Qué ambiente hay en la multitud reunida?',
          options: [
            'Expectativa curiosa ante un resultado probable',
            'Aburrimiento y desinterés',
            'Miedo a que la carrera sea peligrosa',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo suben los testigos la importancia de la carrera?',
          options: [
            'Todos recordarán lo que pase de verdad',
            'Acortan el camino para los corredores',
            'Obligan a la Liebre a dormirse',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué tensión hay entre lo que esperan y lo que hacen?',
          options: [
            'Suponen que la Liebre gana pero igual miran atentos',
            'Creen que el Zorro hará trampa y lo ignoran',
            'Piensan que la Tortuga no vendrá',
          ],
          correctIndex: 0,
        },
      ],
    },
    '04_At_the_Starting_Line': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién marca la línea de salida?',
          options: ['El Zorro', 'La Liebre', 'El Pájaro'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo está la Tortuga?',
          options: ['Tranquila y lista', 'Enojada y gritando', 'Durmiendo'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué hacen los animales?',
          options: ['Miran y esperan', 'Huyen', 'Se van a casa'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué papel tiene el Zorro antes de la salida?',
          options: [
            'Marca la línea y dirige el inicio',
            'Corre al lado de los competidores',
            'Apuesta por el ganador',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo difieren los corredores en la línea?',
          options: [
            'La Tortuga está serena; la Liebre rebota con energía',
            'Ambos gritan enojados',
            'Ambos se esconden de la multitud',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo se comporta la multitud en ese momento?',
          options: [
            'Observa en silencio esperando la señal',
            'Ya celebra al ganador',
            'Se marcha del camino',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Qué sugiere la tarea del Zorro sobre la equidad?',
          options: [
            'Una línea neutral mantiene el orden',
            'Ayuda en secreto a la Liebre',
            'Quiere detener el evento',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo contrastan las mentes de los corredores antes de la señal?',
          options: [
            'Serenidad constante frente a impaciencia ansiosa',
            'Igual aburrimiento con la carrera',
            'Miedo compartido a la multitud',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo influye la anticipación colectiva en la salida?',
          options: [
            'El silencio de todos crea tensión para el primer paso',
            'El ruido distrae a los corredores',
            'Nadie presta atención al momento',
          ],
          correctIndex: 0,
        },
      ],
    },
    '05_The_Race_Begins': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién grita “¡Ya!”?',
          options: ['El Zorro', 'La Tortuga', 'El Búho'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Quién corre rápido y desaparece?',
          options: ['La Liebre', 'La Tortuga', 'El Zorro'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo avanza la Tortuga?',
          options: ['Lenta y constante', 'Salta alto', 'Se sienta y para'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Cómo empieza la carrera?',
          options: [
            'Con la señal del Zorro',
            'Con la decisión de la Liebre sola',
            'Sin que nadie marque el tiempo',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo se mueven los corredores al inicio?',
          options: [
            'La Liebre se lanza; la Tortuga da pasos firmes',
            'Ambos avanzan muy despacio',
            'Ambos se sientan a descansar',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Por qué animan los animales?',
          options: [
            'Están emocionados de ver la carrera',
            'Quieren que se detenga',
            'Animan otro juego distinto',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo marca el arranque el contraste del relato?',
          options: [
            'La Liebre desaparece veloz y la Tortuga elige la constancia',
            'Ambos muestran igual velocidad y esfuerzo',
            'El Zorro se niega a iniciar la carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Por qué es importante el grito del Zorro?',
          options: [
            'Da un inicio claro y justo, sin excusas',
            'Asusta a los corredores para que se detengan',
            'Termina la competencia temprano',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué contraste temprano anticipa el final?',
          options: [
            'Velocidad sin constancia versus constancia sin velocidad',
            'Falta de público',
            'Ambos ignorando el recorrido',
          ],
          correctIndex: 0,
        },
      ],
    },
    '06_Overconfidence': {
      beginner: [
        {
          id: 'q1',
          question: '¿Qué piensa la Liebre?',
          options: ['Que ya ganó', 'Que puede perder', 'Que está perdida'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué hace la Liebre?',
          options: ['Duerme en la hierba tibia', 'Corre más fuerte', 'Sale de la carrera'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué hace la Tortuga?',
          options: ['Sigue caminando', 'Se detiene a dormir', 'Corre a casa'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué error comete la Liebre?',
          options: [
            'Cree que ganó y se acuesta a dormir',
            'Toma el camino equivocado',
            'Abandona la carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué mantiene en marcha a la Tortuga?',
          options: [
            'Atención constante al camino',
            'Miedo al público',
            'Perseguir al Zorro',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué representa la hierba tibia para la Liebre?',
          options: [
            'Comodidad que lo hace confiarse',
            'Un lugar para esconderse',
            'La meta final de la carrera',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo interpreta mal la Liebre el silencio detrás de él?',
          options: [
            'Lo toma como prueba de que la carrera ya está decidida',
            'Cree que viene una tormenta',
            'Piensa que el camino terminó',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué simboliza su siesta?',
          options: [
            'La confianza cómoda que lo detiene',
            'Una estrategia para frenar a la Tortuga',
            'Una gestión cuidadosa del tiempo',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo responde el avance de la Tortuga a la pausa de la Liebre?',
          options: [
            'El progreso continuo reemplaza la velocidad desperdiciada',
            'También decide dormir',
            'Espera a que la Liebre despierte',
          ],
          correctIndex: 0,
        },
      ],
    },
    '07Steady_Progress': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién sigue caminando con los mismos pasos lentos?',
          options: ['La Tortuga', 'La Liebre', 'El Zorro'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Quién sigue dormido?',
          options: ['La Liebre', 'La Tortuga', 'El público'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Se detiene la Tortuga?',
          options: ['No, sigue adelante', 'Sí, duerme', 'Sí, vuelve atrás'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Cómo avanza la Tortuga por el camino?',
          options: [
            'Con pasos constantes y firmes',
            'Corriendo a saltos',
            'Saliendo del camino',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué momento clave ocurre mientras la Liebre duerme?',
          options: [
            'La Tortuga lo pasa en silencio',
            'El Zorro termina la carrera',
            'El público se va',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué muestra no detenerse sobre la Tortuga?',
          options: ['Su disciplina y constancia', 'Su miedo a la Liebre', 'Su necesidad de un mapa'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Qué significa que la Tortuga pase a la Liebre dormida?',
          options: [
            'La constancia supera al talento cuando el talento descansa',
            'Ahí termina la carrera oficialmente',
            'El Zorro descalifica a la Liebre',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo funciona aquí el ritmo constante como estrategia?',
          options: [
            'Elimina riesgos de pausas o arranques',
            'Oculta su posición al público',
            'Depende de atajos secretos',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué emoción falta en el avance de la Tortuga?',
          options: ['Alarde', 'Alegría', 'Esperanza'],
          correctIndex: 0,
        },
      ],
    },
    '08_A_Sudden_Awakening': {
      beginner: [
        {
          id: 'q1',
          question: '¿Qué despierta a la Liebre?',
          options: ['Un viento en las hojas', 'Un grito del Zorro', 'Una campana fuerte'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué ve al despertar?',
          options: ['A la Tortuga cerca de la meta', 'A nadie en el camino', 'Lluvia que detiene la carrera'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué hace la Liebre después?',
          options: ['Salta y corre rápido', 'Vuelve a dormir', 'Deja la carrera'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué provoca el despertar de la Liebre?',
          options: [
            'El viento moviendo las hojas',
            'El Zorro lo sacude',
            'Truenos y relámpagos',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué tan cerca está la Tortuga cuando mira?',
          options: [
            'Muy cerca de la meta',
            'Todavía muy atrás',
            'Sentada a su lado',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo responde la Liebre a lo que ve?',
          options: [
            'Corre en pánico',
            'Espera con calma',
            'Pide atrasar la carrera',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo crea el entorno el giro de este capítulo?',
          options: [
            'Una ráfaga despierta a la Liebre y acaba su confianza',
            'El Zorro cancela la carrera',
            'El camino termina de golpe',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué muestra la reacción de la Liebre sobre su conciencia?',
          options: [
            'Comprende tarde lo cerca que está la meta',
            'Aún cree que no puede perder',
            'Quiere reiniciar la carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo cambia la posición de la Tortuga la dinámica?',
          options: [
            'Con tan poca distancia, la Liebre casi no tiene tiempo de recuperar',
            'Obliga al Zorro a acortar la pista',
            'Significa que la Tortuga debe detenerse',
          ],
          correctIndex: 0,
        },
      ],
    },
    '09_The_Final_Stride': {
      beginner: [
        {
          id: 'q1',
          question: '¿Quién llega primero a la meta?',
          options: ['La Tortuga', 'La Liebre', 'El Zorro'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué hace el bosque?',
          options: ['Aplaude al ganador', 'Se va a casa', 'Detiene la carrera'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Puede alcanzar la Liebre a tiempo?',
          options: ['No, llega tarde', 'Sí, gana', 'Renuncia antes del final'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Por qué no puede ganar la Liebre aunque corra rápido?',
          options: [
            'La Tortuga ya está en la meta',
            'El Zorro bloquea el camino',
            'Se lastima la pata',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué celebran los aplausos?',
          options: [
            'La perseverancia más que la velocidad pura',
            'La línea de salida del Zorro',
            'La cancelación de la carrera',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué lección se repite al final?',
          options: [
            'El esfuerzo constante puede vencer a un sprint tardío',
            'La velocidad siempre gana',
            'Dormir ayuda a ganar',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Qué celebra en el fondo este resultado?',
          options: [
            'La perseverancia que llega hasta el final',
            'Un tropiezo de suerte de la Liebre',
            'Los trucos del Zorro',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo subraya el sprint de la Liebre el mensaje?',
          options: [
            'La urgencia tardía no borra la confianza excesiva',
            'Prueba que él fue el verdadero ganador',
            'Muestra que el público prefiere la velocidad',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Por qué los aplausos se enfocan en la constancia?',
          options: [
            'La comunidad valora el esfuerzo que nunca paró',
            'No vieron correr a la Liebre',
            'No les gustan los animales rápidos',
          ],
          correctIndex: 0,
        },
      ],
    },
    '10_Lesson_of_the_Day': {
      beginner: [
        {
          id: 'q1',
          question: '¿Cómo se siente la Liebre después?',
          options: ['Cansada y triste', 'Contenta y feliz', 'Hambrienta y tranquila'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo actúa la Tortuga?',
          options: ['Sonríe con amabilidad', 'Se burla de la Liebre', 'Corre lejos'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué aprende el bosque?',
          options: [
            'Que lento y constante puede ganar',
            'Que dormir gana carreras',
            'Que solo importa la velocidad',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Cómo describen a la Liebre tras perder?',
          options: [
            'Cansada y arrepentida',
            'Enojada y gritando',
            'Orgullosa y riendo',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo trata la Tortuga a la Liebre?',
          options: [
            'Con amabilidad y sin presumir',
            'Burlándose de su error',
            'Ignorándola por completo',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué lección toma el bosque de la carrera?',
          options: [
            'El esfuerzo constante puede vencer a la velocidad sola',
            'La velocidad es lo único que cuenta',
            'Toda carrera debe terminar en empate',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo influye la amabilidad de la Tortuga en la moraleja?',
          options: [
            'Convierte la victoria en una lección de humildad, no de burla',
            'Oculta que él ganó',
            'Sugiere que la carrera fue injusta',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué lección central nombra el bosque?',
          options: [
            'La constancia puede vencer a la velocidad descuidada',
            'Descansar siempre es el mejor plan',
            'Es mejor evitar los retos',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo se relaciona el cansancio de la Liebre con su decisión anterior?',
          options: [
            'La confianza excesiva lo llevó a un esfuerzo tardío que agota',
            'Entrenó demasiado antes de la carrera',
            'Llevó a la Tortuga un tramo',
          ],
          correctIndex: 0,
        },
      ],
    },
    '11_A_New_Understanding': {
      beginner: [
        {
          id: 'q1',
          question: '¿Qué aprende la Liebre?',
          options: ['A respetar a otros', 'A dormir más', 'A dejar de correr'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Quién recibe elogios por ser constante?',
          options: ['La Tortuga', 'El Zorro', 'El Búho'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿En qué se convierte la historia de su carrera?',
          options: [
            'En una lección para todos',
            'En algo olvidado',
            'En una historia distinta',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué cambio ocurre en la Liebre?',
          options: [
            'Gana respeto por los demás',
            'Decide no correr nunca más',
            'Culpa al Zorro por perder',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo ve el bosque a la Tortuga?',
          options: [
            'La alaba por su esfuerzo constante',
            'La ignora después de la carrera',
            'Le pide ir todavía más despacio',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo usan los amigos la historia después?',
          options: [
            'La recuerdan cuando quieren rendirse',
            'La usan para burlarse de los lentos',
            'Evitan hablar de ella otra vez',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Cómo muestra la Liebre su crecimiento?',
          options: [
            'Sustituye la arrogancia por humildad',
            'Ya no le importa correr',
            'Busca venganza',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo considera ahora la comunidad a la Tortuga?',
          options: [
            'Como ejemplo de disciplina constante',
            'Como ganadora por suerte',
            'Como alguien que debe dejar de correr',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿De qué forma funciona la historia después de la carrera?',
          options: [
            'Como recordatorio compartido cuando perseverar cuesta',
            'Como aviso de no intentar cosas nuevas',
            'Como secreto que se esconde a los nuevos',
          ],
          correctIndex: 0,
        },
      ],
    },
    '12_The_Enduring_Moral': {
      beginner: [
        {
          id: 'q1',
          question: '¿Qué recuerdan los animales?',
          options: ['La carrera', 'Una canción', 'Una tormenta'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Qué frase repiten?',
          options: [
            '"Lento y constante puede ganar"',
            '"Dormir es lo mejor"',
            '"La velocidad siempre primero"',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué cualidad dura?',
          options: ['Paciencia', 'Pereza', 'Ira'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: '¿Qué parte de la historia queda en la memoria del bosque?',
          options: [
            'La carrera y su enseñanza',
            'Solo la línea de salida',
            'Solo la siesta de la Liebre',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo resumen la moraleja principal?',
          options: [
            'Lento y constante puede ganar',
            'La velocidad siempre gana',
            'Nadie debe volver a correr',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Cómo comparan paciencia y velocidad?',
          options: [
            'La velocidad ayuda, pero la paciencia dura',
            'La paciencia no sirve en las carreras',
            'La velocidad y la paciencia son iguales',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: '¿Por qué perdura esta moraleja?',
          options: [
            'Su lección sobre paciencia y constancia sigue útil',
            'Es la única historia que conocen',
            'Cambia cada vez que se cuenta',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: '¿Cómo contrasta el relato velocidad y paciencia?',
          options: [
            'La velocidad ayuda, pero la paciencia es duradera',
            'La paciencia sobra cuando eres rápido',
            'La velocidad y la paciencia se olvidan rápido',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: '¿Qué mantiene viva la historia?',
          options: [
            'Se repite para que la lección no se pierda',
            'Está escrita en código secreto',
            'Se guarda cerrada en una caja',
          ],
          correctIndex: 0,
        },
      ],
    },
  },
  german: {
    '00_preamble': {
      beginner: [
        {
          id: 'q1',
          question: 'Wie sind diese Geschichten?',
          options: ['Kurz', 'Sehr lang', 'Schwer zu beenden'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wo kannst du sie lesen?',
          options: ['Auf jedem Gerät', 'Nur in einem Buch', 'Nur in der Schule'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was behalten die Geschichten?',
          options: ['Bedeutung', 'Nur Musik', 'Nur Bilder'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Warum sind die Kapitel kurz?',
          options: [
            'Damit eine Seite auf einen Bildschirm passt',
            'Um wichtige Ideen wegzulassen',
            'Um die Botschaft zu verstecken',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Welches Gleichgewicht sucht die Sammlung?',
          options: [
            'Einfache Lektüre mit echtem Sinn',
            'Komplizierte Wörter für Experten',
            'Nur schnelle Action ohne Botschaft',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was stellt die erste Fabel vor?',
          options: [
            'Themen wie Selbstvertrauen, Geduld und Ausdauer',
            'Eine Liste mit Grammatikregeln',
            'Anweisungen für ein Rennen',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Welche Leseerfahrung laden die kurzen Kapitel ein?',
          options: [
            'Eine Szene in einer Sitzung und auf einem Bildschirm zu beenden',
            'Zwischen zufälligen Geschichten zu springen',
            'Ohne Nachdenken weiterzueilen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie bestimmt die erste Geschichte den Ton?',
          options: [
            'Sie zeigt kurze Szenen mit klaren Themen',
            'Sie verschiebt die Moral bis zum letzten Buch',
            'Sie achtet nur auf Action ohne Sinn',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welchem doppelten Zweck sollen die Geschichten dienen?',
          options: [
            'Begleiter und Wegweiser für Lernende zu sein',
            'Alles Grammatiklernen zu ersetzen',
            'Mit langen Romanen zu konkurrieren',
          ],
          correctIndex: 0,
        },
      ],
    },
    '01_A_Boastful_Runner': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer rennt sehr schnell?',
          options: ['Der Hase', 'Der Fuchs', 'Die Schildkröte'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was macht der Hase mit den anderen?',
          options: ['Er prahlt und lacht', 'Er versteckt sich', 'Er bittet um Hilfe'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was fragen sich die Tiere?',
          options: ['Ob ihn jemand schlagen kann', 'Ob das Rennen ausfällt', 'Ob der Tag zu Ende ist'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Wie zeigt der Hase seine Arroganz?',
          options: [
            'Er prahlt und verspottet Langsame',
            'Er trainiert still jeden Tag',
            'Er weigert sich zu laufen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was fragen sich die Waldtiere ständig?',
          options: [
            'Ob ihn jemand besiegen könnte',
            'Wie man das Rennen stoppt',
            'Warum der Fuchs zu spät kommt',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was bewirkt sein tägliches Prahlen?',
          options: [
            'Seine Überheblichkeit wächst mit jedem Sieg',
            'Er wird mit der Zeit bescheidener',
            'Er vergisst, dass er schnell ist',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie wird Bewunderung über den Hasen zu Ärger?',
          options: [
            'Ständiges Prahlen überdeckt sein Talent',
            'Sein Schweigen verwirrt den Wald',
            'Seine Verletzungen stoppen die Rennen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was zeigt seine Behauptung, schneller als die Zeit zu sein?',
          options: [
            'Seinen Hochmut und das Gefühl, unbesiegbar zu sein',
            'Seine Angst, langsamer zu werden',
            'Seinen Respekt vor der Schildkröte',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie deutet der Text einen kommenden Wettkampf an?',
          options: [
            'Er erwähnt, dass andere still über seine Grenzen nachdenken',
            'Er sagt, dass es keine anderen Läufer gibt',
            'Er beendet die Geschichte sofort',
          ],
          correctIndex: 0,
        },
      ],
    },
    '02_A_Quiet_Challenge': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer fordert den Hasen heraus?',
          options: ['Die Schildkröte', 'Der Fuchs', 'Der Vogel'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie reagiert der Wald?',
          options: ['Er wird still', 'Er beginnt zu tanzen', 'Er verlässt den Weg'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie wird die Schildkröte beschrieben?',
          options: ['Ruhig', 'Wütend', 'Schläfrig'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Was bringt die Schildkröte zum Sprechen?',
          options: [
            'Sie hört das Prahlen des Hasen',
            'Der Fuchs befiehlt ihr zu laufen',
            'Die Menge schiebt sie nach vorne',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Warum wird der Wald still?',
          options: [
            'Ein langsamer Läufer fordert den schnellsten heraus',
            'Das Rennen wird abgesagt',
            'Das Wetter wird stürmisch',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Eigenschaft zeigt die Schildkröte?',
          options: ['Ruhiges Selbstvertrauen', 'Laute Wut', 'Ängstliche Zweifel'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Warum wirkt die Herausforderung der Schildkröte trotz weniger Worte stark?',
          options: [
            'Ihr ruhiger Ton und ihr einfaches Versprechen',
            'Eine wütende Rede über Gerechtigkeit',
            'Eine Bitte um eine kürzere Strecke',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Warum ist die Stille des Waldes bedeutsam?',
          options: [
            'Sie zeigt, wie unerwartet der Herausforderer ist',
            'Sie beweist, dass niemand das Rennen will',
            'Sie bedeutet, dass das Rennen unmöglich ist',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie wird hier Selbstvertrauen neu gezeigt?',
          options: [
            'Leise Entschlossenheit steht lauter Arroganz gegenüber',
            'Es beweist, dass Geschwindigkeit immer gewinnt',
            'Es zeigt, dass der Fuchs alles kontrolliert',
          ],
          correctIndex: 0,
        },
      ],
    },
    '03_The_Forest_Gathers': {
      beginner: [
        {
          id: 'q1',
          question: 'Was tun die Tiere, als sie vom Rennen hören?',
          options: ['Sie gehen zum Weg', 'Sie schlafen ein', 'Sie verstecken sich zu Hause'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wer soll nach Meinung der meisten gewinnen?',
          options: ['Der Hase', 'Die Schildkröte', 'Der Fuchs'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wer wartet startbereit?',
          options: ['Hase und Schildkröte', 'Nur der Fuchs', 'Nur die Vögel'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Warum versammeln sich Vögel, Eichhörnchen und andere?',
          options: [
            'Neugier treibt sie zum Rennen',
            'Sie müssen den Weg überqueren',
            'Sie wollen das Rennen stoppen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Welche Erwartung haben die meisten?',
          options: [
            'Der Hase wird leicht gewinnen',
            'Das Rennen startet nie',
            'Der Fuchs läuft an seiner Stelle',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Warum wollen sie trotzdem zusehen?',
          options: [
            'Sie wollen die Geschichte miterleben',
            'Sie hoffen auf eine Absage',
            'Sie müssen die Schritte zählen',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Welche Stimmung herrscht in der Menge?',
          options: [
            'Neugierige Erwartung eines wahrscheinlichen Ergebnisses',
            'Langeweile und Desinteresse',
            'Angst vor einem gefährlichen Rennen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie erhöhen die Zuschauer den Wert des Rennens?',
          options: [
            'Alle werden sich erinnern, was wirklich geschieht',
            'Sie verkürzen die Strecke für die Läufer',
            'Sie zwingen den Hasen einzuschlafen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Spannung besteht zwischen Erwartung und Handeln?',
          options: [
            'Sie glauben, der Hase gewinnt, schauen aber genau hin',
            'Sie denken, der Fuchs mogelt und ignorieren ihn',
            'Sie meinen, die Schildkröte kommt nicht',
          ],
          correctIndex: 0,
        },
      ],
    },
    '04_At_the_Starting_Line': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer zieht die Startlinie?',
          options: ['Der Fuchs', 'Der Hase', 'Der Vogel'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie ist die Schildkröte?',
          options: ['Ruhig und bereit', 'Wütend und laut', 'Schlafend'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was machen die Tiere?',
          options: ['Zuschauen und warten', 'Weglaufen', 'Nach Hause gehen'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Welche Aufgabe hat der Fuchs vor dem Start?',
          options: [
            'Er markiert die Linie und leitet den Beginn',
            'Er läuft neben den Teilnehmern',
            'Er wettet auf den Sieger',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie unterscheiden sich die Läufer an der Linie?',
          options: [
            'Die Schildkröte ist ruhig; der Hase springt vor Energie',
            'Beide sind wütend und schreien',
            'Beide verstecken sich vor der Menge',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie verhält sich das Publikum in diesem Moment?',
          options: [
            'Es wartet still auf das Signal',
            'Es feiert schon den Sieger',
            'Es verlässt den Weg',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Was sagt die Aufgabe des Fuchses über Fairness aus?',
          options: [
            'Eine neutrale Startlinie hält Ordnung',
            'Er hilft heimlich dem Hasen',
            'Er will das Ereignis stoppen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie unterscheiden sich die Gedanken der Läufer vor dem Signal?',
          options: [
            'Gelassene Beständigkeit gegen ungeduldige Energie',
            'Gleiche Langeweile am Rennen',
            'Gemeinsame Angst vor dem Publikum',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie beeinflusst die gemeinsame Spannung den Start?',
          options: [
            'Die stille Menge baut Spannung für den ersten Schritt auf',
            'Der Lärm lenkt die Läufer ab',
            'Niemand achtet auf den Moment',
          ],
          correctIndex: 0,
        },
      ],
    },
    '05_The_Race_Begins': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer ruft „Los“?',
          options: ['Der Fuchs', 'Die Schildkröte', 'Die Eule'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wer rennt schnell davon?',
          options: ['Der Hase', 'Die Schildkröte', 'Der Fuchs'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie bewegt sich die Schildkröte?',
          options: ['Langsam und gleichmäßig', 'Sie springt hoch', 'Sie setzt sich hin'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Wie beginnt das Rennen?',
          options: [
            'Mit dem Signal des Fuchses',
            'Mit der Entscheidung des Hasen allein',
            'Ohne dass jemand die Zeit markiert',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie bewegen sich die Läufer zu Beginn?',
          options: [
            'Der Hase sprintet los, die Schildkröte geht Schritt für Schritt',
            'Beide bewegen sich sehr langsam',
            'Beide setzen sich aus',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Warum feuern die Tiere an?',
          options: [
            'Sie freuen sich auf das Rennen',
            'Sie wollen, dass es endet',
            'Sie jubeln für ein anderes Spiel',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie zeigt der Start den Gegensatz der Geschichte?',
          options: [
            'Der Hase verschwindet in der Geschwindigkeit, die Schildkröte wählt die Konstanz',
            'Beide zeigen gleiche Geschwindigkeit',
            'Der Fuchs weigert sich, das Rennen zu starten',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Warum ist der Ruf des Fuchses wichtig?',
          options: [
            'Er gibt einen klaren, fairen Start ohne Ausreden',
            'Er erschreckt die Läufer und stoppt sie',
            'Er beendet früh den Wettbewerb',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welcher frühe Gegensatz deutet das Ende an?',
          options: [
            'Geschwindigkeit ohne Beständigkeit gegen Beständigkeit ohne Geschwindigkeit',
            'Fehlende Zuschauer',
            'Beide ignorieren die Strecke',
          ],
          correctIndex: 0,
        },
      ],
    },
    '06_Overconfidence': {
      beginner: [
        {
          id: 'q1',
          question: 'Was denkt der Hase?',
          options: ['Er hat schon gewonnen', 'Er könnte verlieren', 'Er hat sich verlaufen'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was tut der Hase?',
          options: ['Er schläft im warmen Gras', 'Er rennt stärker', 'Er verlässt das Rennen'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was macht die Schildkröte?',
          options: ['Geht weiter', 'Schläft auch', 'Läuft nach Hause'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Welchen Fehler macht der Hase?',
          options: [
            'Er glaubt zu gewinnen und legt sich schlafen',
            'Er nimmt den falschen Weg',
            'Er gibt auf und geht',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was hält die Schildkröte in Bewegung?',
          options: [
            'Steter Fokus auf den Weg',
            'Angst vor dem Publikum',
            'Sie verfolgt den Fuchs',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was bedeutet das warme Gras für den Hasen?',
          options: [
            'Bequemlichkeit, die ihn leichtsinnig macht',
            'Einen Platz zum Verstecken',
            'Das Ziel des Rennens',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie deutet der Hase die Stille hinter sich falsch?',
          options: [
            'Er sieht darin einen Beweis, dass alles entschieden ist',
            'Er fürchtet einen Sturm',
            'Er denkt, der Weg sei zu Ende',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was symbolisiert sein Nickerchen?',
          options: [
            'Bequeme Selbstsicherheit, die ihn stoppt',
            'Eine Strategie, die Schildkröte zu bremsen',
            'Eine geplante Zeitkontrolle',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie antwortet die Bewegung der Schildkröte auf seine Pause?',
          options: [
            'Ständiger Fortschritt ersetzt verschwendete Geschwindigkeit',
            'Sie entscheidet sich auch zu schlafen',
            'Sie wartet, bis er aufwacht',
          ],
          correctIndex: 0,
        },
      ],
    },
    '07Steady_Progress': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer läuft weiter mit den gleichen langsamen Schritten?',
          options: ['Die Schildkröte', 'Der Hase', 'Der Fuchs'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wer schläft noch?',
          options: ['Der Hase', 'Die Schildkröte', 'Das Publikum'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Hält die Schildkröte an?',
          options: ['Nein, sie geht weiter', 'Ja, sie schläft', 'Ja, sie kehrt um'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Wie geht die Schildkröte den Weg entlang?',
          options: [
            'Mit gleichmäßigen, festen Schritten',
            'In Sprints',
            'Sie verlässt den Weg',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was passiert, während der Hase schläft?',
          options: [
            'Die Schildkröte überholt ihn leise',
            'Der Fuchs beendet das Rennen',
            'Die Zuschauer gehen weg',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was zeigt das Nicht-Anhalten der Schildkröte?',
          options: ['Disziplin und Ausdauer', 'Angst vor dem Hasen', 'Bedarf nach einer Karte'],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Was bedeutet es, dass die Schildkröte den schlafenden Hasen überholt?',
          options: [
            'Ausdauer überholt Talent, wenn Talent ruht',
            'Dort endet das Rennen offiziell',
            'Der Fuchs disqualifiziert den Hasen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie wirkt gleichmäßiges Tempo hier als Strategie?',
          options: [
            'Es vermeidet Risiken durch Pausen oder Spurts',
            'Es versteckt ihre Position',
            'Es hängt von geheimen Abkürzungen ab',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Emotion fehlt im Fortkommen der Schildkröte?',
          options: ['Prahlerei', 'Freude', 'Hoffnung'],
          correctIndex: 0,
        },
      ],
    },
    '08_A_Sudden_Awakening': {
      beginner: [
        {
          id: 'q1',
          question: 'Was weckt den Hasen?',
          options: ['Ein Wind in den Blättern', 'Ein Ruf des Fuchses', 'Eine laute Glocke'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was sieht er beim Aufwachen?',
          options: [
            'Die Schildkröte nahe der Ziellinie',
            'Niemanden auf dem Weg',
            'Regen, der das Rennen stoppt',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was tut der Hase danach?',
          options: ['Er springt auf und rennt schnell', 'Er schläft weiter', 'Er gibt auf'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Was löst das Erwachen des Hasen aus?',
          options: [
            'Wind, der die Blätter bewegt',
            'Der Fuchs schüttelt ihn',
            'Donner und Blitz',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie nah ist die Schildkröte, als er schaut?',
          options: [
            'Sehr nah an der Ziellinie',
            'Noch weit hinten',
            'Direkt neben ihm',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie reagiert der Hase auf das, was er sieht?',
          options: [
            'Er sprintet erschrocken los',
            'Er wartet ruhig',
            'Er bittet um eine Pause',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie sorgt die Umgebung für den Wendepunkt des Kapitels?',
          options: [
            'Ein Windstoß weckt den Hasen und beendet seine Selbstzufriedenheit',
            'Der Fuchs sagt das Rennen ab',
            'Der Weg endet plötzlich',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was zeigt die Reaktion des Hasen über sein Bewusstsein?',
          options: [
            'Er merkt zu spät, wie nah das Ziel ist',
            'Er glaubt weiter, dass er nicht verlieren kann',
            'Er will das Rennen neu starten',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie verändert die Position der Schildkröte die Dynamik?',
          options: [
            'Bei so wenig Strecke bleibt dem Hasen kaum Zeit aufzuholen',
            'Der Fuchs muss die Strecke kürzen',
            'Die Schildkröte muss anhalten',
          ],
          correctIndex: 0,
        },
      ],
    },
    '09_The_Final_Stride': {
      beginner: [
        {
          id: 'q1',
          question: 'Wer erreicht zuerst die Linie?',
          options: ['Die Schildkröte', 'Der Hase', 'Der Fuchs'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was macht der Wald?',
          options: ['Er jubelt dem Sieger', 'Er geht nach Hause', 'Er stoppt das Rennen'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Kann der Hase noch rechtzeitig aufholen?',
          options: ['Nein, er ist zu spät', 'Ja, er gewinnt', 'Er hört vor dem Ende auf'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Warum kann der Hase trotz Schnelligkeit nicht gewinnen?',
          options: [
            'Die Schildkröte ist schon am Ziel',
            'Der Fuchs blockiert den Weg',
            'Er verletzt sein Bein',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Was feiern die Jubelrufe?',
          options: [
            'Ausdauer statt bloßer Geschwindigkeit',
            'Die Startlinie des Fuchses',
            'Die Absage des Rennens',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Lehre wird im Ziel bekräftigt?',
          options: [
            'Stetes Bemühen kann einen späten Sprint schlagen',
            'Geschwindigkeit gewinnt immer',
            'Schlaf hilft beim Siegen',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Was feiert das Ergebnis letztlich?',
          options: [
            'Ausdauer, die bis zum Schluss trägt',
            'Ein glückliches Stolpern des Hasen',
            'Die Tricks des Fuchses',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie unterstreicht der Sprint des Hasen die Aussage?',
          options: [
            'Zu spät empfundener Druck löscht frühere Selbstzufriedenheit nicht',
            'Er beweist, dass er der wahre Sieger war',
            'Er zeigt, dass das Publikum Geschwindigkeit liebt',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Warum jubeln die Tiere der Ausdauer und nicht der Geschwindigkeit?',
          options: [
            'Die Gemeinschaft schätzt ununterbrochenen Einsatz',
            'Sie sahen den Hasen nicht laufen',
            'Sie mögen schnelle Tiere nicht',
          ],
          correctIndex: 0,
        },
      ],
    },
    '10_Lesson_of_the_Day': {
      beginner: [
        {
          id: 'q1',
          question: 'Wie fühlt sich der Hase nach dem Rennen?',
          options: ['Müde und traurig', 'Fröhlich und stolz', 'Hungrig und ruhig'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie verhält sich die Schildkröte?',
          options: ['Sie lächelt freundlich', 'Sie verspottet den Hasen', 'Sie läuft weg'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Lektion lernt der Wald?',
          options: [
            'Langsam und stetig kann gewinnen',
            'Schlafen gewinnt Rennen',
            'Nur Geschwindigkeit zählt',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Wie wird der Hase nach der Niederlage beschrieben?',
          options: [
            'Müde und voller Reue',
            'Wütend und laut',
            'Stolz und lachend',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie behandelt die Schildkröte den Hasen?',
          options: [
            'Mit Freundlichkeit statt Prahlerei',
            'Indem sie seinen Fehler verspottet',
            'Indem sie ihn völlig ignoriert',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Lehre zieht der Wald aus dem Rennen?',
          options: [
            'Stetiger Einsatz kann reine Geschwindigkeit schlagen',
            'Geschwindigkeit ist das Einzige, was zählt',
            'Jedes Rennen soll unentschieden enden',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie prägt die Freundlichkeit der Schildkröte die Moral?',
          options: [
            'Sie macht den Sieg zu einer Lektion in Demut, nicht in Spott',
            'Sie verschweigt, dass sie gewonnen hat',
            'Sie zeigt, dass das Rennen unfair war',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Welche zentrale Lehre benennt der Wald?',
          options: [
            'Beständigkeit kann unbedachte Geschwindigkeit besiegen',
            'Ausruhen ist immer der beste Plan',
            'Herausforderungen sollte man meiden',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie hängt die Erschöpfung des Hasen mit seiner früheren Wahl zusammen?',
          options: [
            'Seine Überheblichkeit führte zu einem späten, anstrengenden Sprint',
            'Er hat zu hart vor dem Rennen trainiert',
            'Er trug die Schildkröte ein Stück',
          ],
          correctIndex: 0,
        },
      ],
    },
    '11_A_New_Understanding': {
      beginner: [
        {
          id: 'q1',
          question: 'Was lernt der Hase?',
          options: ['Andere zu respektieren', 'Mehr zu schlafen', 'Mit Laufen aufzuhören'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wer wird für Beständigkeit gelobt?',
          options: ['Die Schildkröte', 'Der Fuchs', 'Die Eule'],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was wird aus ihrer Renn-Geschichte?',
          options: [
            'Eine Lektion für alle',
            'Etwas Vergessenes',
            'Eine andere Geschichte',
          ],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Welche Veränderung gibt es beim Hasen?',
          options: [
            'Er bekommt Respekt für andere',
            'Er beschließt, nie mehr zu laufen',
            'Er gibt dem Fuchs die Schuld',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie sieht der Wald die Schildkröte?',
          options: [
            'Er lobt sie für stetige Mühe',
            'Er ignoriert sie nach dem Rennen',
            'Er bittet sie, noch langsamer zu sein',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie nutzen die Freunde die Geschichte später?',
          options: [
            'Sie erinnern sich daran, wenn sie aufgeben wollen',
            'Sie nutzen sie, um Langsame auszulachen',
            'Sie vermeiden es, wieder darüber zu reden',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Wie zeigt der Hase sein Wachstum?',
          options: [
            'Er ersetzt Arroganz durch Demut',
            'Er kümmert sich nicht mehr ums Rennen',
            'Er sucht Rache',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie betrachtet die Gemeinschaft die Schildkröte jetzt?',
          options: [
            'Als Beispiel für Disziplin und Beständigkeit',
            'Als glückliche Siegerin',
            'Als jemanden, der aufhören sollte zu laufen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie wirkt die Geschichte nach dem Rennen?',
          options: [
            'Als geteilte Erinnerung, wenn Durchhalten schwer fällt',
            'Als Warnung, nichts Neues zu versuchen',
            'Als Geheimnis vor Neuen',
          ],
          correctIndex: 0,
        },
      ],
    },
    '12_The_Enduring_Moral': {
      beginner: [
        {
          id: 'q1',
          question: 'Was erinnern die Tiere?',
          options: ['Das Rennen', 'Ein Lied', 'Einen Sturm'],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Welche Zeile wiederholen sie?',
          options: [
            '„Langsam und stetig kann gewinnen“',
            '„Schlafen ist am besten“',
            '„Schnelligkeit ist immer zuerst“',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Welche Eigenschaft hält an?',
          options: ['Geduld', 'Faulheit', 'Wut'],
          correctIndex: 0,
        },
      ],
      intermediate: [
        {
          id: 'q1',
          question: 'Welcher Teil der Geschichte bleibt im Gedächtnis?',
          options: [
            'Das Rennen und seine Lehre',
            'Nur die Startlinie',
            'Nur das Nickerchen des Hasen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie fassen sie die Hauptmoral zusammen?',
          options: [
            'Langsam und stetig kann gewinnen',
            'Geschwindigkeit gewinnt immer',
            'Niemand soll wieder rennen',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Wie vergleichen sie Geduld und Geschwindigkeit?',
          options: [
            'Geschwindigkeit hilft, aber Geduld bleibt',
            'Geduld nützt in Rennen nichts',
            'Geschwindigkeit und Geduld sind gleich',
          ],
          correctIndex: 0,
        },
      ],
      advanced: [
        {
          id: 'q1',
          question: 'Warum überdauert diese Moral?',
          options: [
            'Ihre Lehre über Geduld und Ausdauer bleibt nützlich',
            'Es ist die einzige Geschichte, die sie kennen',
            'Sie ändert sich jedes Mal',
          ],
          correctIndex: 0,
        },
        {
          id: 'q2',
          question: 'Wie stellt die Geschichte Geschwindigkeit und Geduld gegenüber?',
          options: [
            'Geschwindigkeit hilft, aber Geduld ist dauerhaft',
            'Geduld ist überflüssig, wenn man schnell ist',
            'Geschwindigkeit und Geduld verschwinden schnell',
          ],
          correctIndex: 0,
        },
        {
          id: 'q3',
          question: 'Was hält die Erzählung lebendig?',
          options: [
            'Sie wird wiederholt, damit die Lehre bleibt',
            'Sie ist in Geheimschrift',
            'Sie liegt in einer Kiste',
          ],
          correctIndex: 0,
        },
      ],
    },
  },
};

const root = path.resolve(__dirname, '..', 'content', 'books', 'The_Tortoise_and_the_Hare');

function ensureQuestionsExist() {
  const langs = Object.keys(data);
  for (const lang of langs) {
    const byChapter = data[lang];
    for (const chapter of chapters) {
      const chapterQuestions = byChapter[chapter];
      if (!chapterQuestions) {
        throw new Error(`Missing questions for ${lang} ${chapter}`);
      }
      for (const [tier, levels] of Object.entries(levelTiers)) {
        const questions = chapterQuestions[tier];
        if (!questions) {
          throw new Error(`Missing ${tier} questions for ${lang} ${chapter}`);
        }
        for (const level of levels) {
          const filePath = path.join(root, chapter, lang, level, `${level}_q.json`);
          fs.writeFileSync(filePath, JSON.stringify({ questions }, null, 2) + '\n', 'utf8');
        }
      }
    }
  }
}

ensureQuestionsExist();
