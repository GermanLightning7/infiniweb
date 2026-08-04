
var SO = window.SO = window.SO || {};

SO.RANKS = ['Junior Mod','Mod','Senior Mod','Admin','Supervisor','Head Admin'];
SO.RANK_COLOR = ['var(--rank0)','var(--rank1)','var(--rank2)','var(--rank3)','var(--rank4)','var(--rank5)'];
SO.START_COUNTS = [35,20,15,8,2,1];
SO.HOURS_RANGE = [[1,20],[3,24],[5,28],[6,32],[8,36],[8,40]];
SO.CAPACITY_PER_RANK = [10,20,35,80,0,0];
SO.MATURITY_BASE_RANGE = [[25,75],[30,80],[35,85],[55,90],[60,92],[65,95]];
SO.MATURITY_FLOOR = [10,15,20,50,55,60];

SO.DIFFICULTY_PRESETS = {
  casual:   {incidentMult:0.65, dramaDecayBonus:0.02, budgetMult:1.3, quitLenience:0.7},
  standard: {incidentMult:1.0,  dramaDecayBonus:0.0,  budgetMult:1.0, quitLenience:1.0},
  brutal:   {incidentMult:1.45, dramaDecayBonus:-0.02,budgetMult:0.75,quitLenience:1.35}
};

SO.NAME_PREFIX = ['Shadow','Night','Pixel','Frost','Crimson','Iron','Storm','Neon','Ghost','Blaze','Lunar','Solar','Venom','Echo','Raven','Titan','Nova','Drift','Volt','Rogue','Cobalt','Ash','Static','Onyx','Maple','Quartz','Hollow','Cinder','Wolfen','Atlas','Crystal','Dusk','Dawn','Glacier','Ember','Tempest','Obsidian','Sable','Stellar','Rune','Feral','Amber','Copper','Jade','Vapor','Rust','Marrow','Halcyon','Cipher','Gravel','Basalt','Thistle','Wisp','Cascade','Fable','Grim','Larch','Moss','Prism'];
SO.NAME_SUFFIX = ['Wolf','Hunter','Knight','Phantom','Reaper','Striker','Fox','Hawk','Viper','Bear','Falcon','Storm','Blade','Walker','Runner','Spirit','Flame','Frost','Drake','Wraith','Crow','Sentinel','Otter','Badger','Pike','Howl','Sparrow','Lynx','Comet','Marsh','Specter','Gale','Talon','Warden','Nomad','Ranger','Mystic','Vortex','Saber','Ronin','Piper','Fen','Thorn','Cove','Warble','Rift','Bramble','Kestrel','Harrow','Loom','Quill','Snare','Vale','Wick','Yarrow','Zephyr','Anchor','Brook','Cairn'];
SO.NAME_DECOR = ['','','','','_TTV','_YT','XD','99','7','_','VII','X','Jr','OW','_03','13','_gg','v2','_real','88','_alt','TV'];

SO.PERSONALITY_POOL = [
  {tag:'Friendly',drama:-6,abuse:-6,mat:3},
  {tag:'Hot-headed',drama:10,abuse:6,mat:-6},
  {tag:'Insecure',drama:4,abuse:-2,mat:-3},
  {tag:'Confident',drama:0,abuse:2,mat:4},
  {tag:'Lazy',drama:2,abuse:0,mat:-5},
  {tag:'Workaholic',drama:-2,abuse:1,mat:5},
  {tag:'Sarcastic',drama:5,abuse:1,mat:0},
  {tag:'Empathetic',drama:-8,abuse:-8,mat:6},
  {tag:'Power-hungry',drama:8,abuse:14,mat:-4},
  {tag:'Humble',drama:-5,abuse:-6,mat:5},
  {tag:'Anxious',drama:3,abuse:-3,mat:-2},
  {tag:'Class Clown',drama:6,abuse:-2,mat:-5},
  {tag:'Stoic',drama:-4,abuse:0,mat:4},
  {tag:'Gossipy',drama:9,abuse:1,mat:-3},
  {tag:'Fiercely Loyal',drama:-5,abuse:-3,mat:4},
  {tag:'Two-faced',drama:10,abuse:8,mat:-6},
  {tag:'Natural Mentor',drama:-6,abuse:-7,mat:8},
  {tag:'Lone Wolf',drama:-1,abuse:0,mat:2},
  {tag:'Easily Bored',drama:5,abuse:3,mat:-4},
  {tag:'Perfectionist',drama:1,abuse:2,mat:5},
  {tag:'Hot-tempered',drama:11,abuse:9,mat:-7},
  {tag:'Peacemaker',drama:-9,abuse:-6,mat:6},
  {tag:'Attention-seeker',drama:7,abuse:3,mat:-4},
  {tag:'Reliable',drama:-4,abuse:-2,mat:5},
  {tag:'Flaky',drama:3,abuse:-1,mat:-5},
  {tag:'Diplomatic',drama:-7,abuse:-5,mat:5},
  {tag:'Reckless',drama:9,abuse:7,mat:-6},
  {tag:'Overcommitted',drama:1,abuse:0,mat:2},
  {tag:'Chill',drama:-3,abuse:-1,mat:1},
  {tag:'Genuinely Caring',drama:-7,abuse:-7,mat:5},
  {tag:'Hypocritical',drama:9,abuse:6,mat:-5},
  {tag:'Strict',drama:1,abuse:4,mat:3},
  {tag:'Encyclopedic',drama:-3,abuse:0,mat:6},
  {tag:'Toxic',drama:10,abuse:9,mat:-6},
  {tag:'Untrustworthy',drama:7,abuse:8,mat:-4},
  {tag:'Conflict-Averse',drama:-6,abuse:-4,mat:1},
  {tag:'Grudge-Holder',drama:8,abuse:5,mat:-3},
  {tag:'Overzealous',drama:4,abuse:6,mat:1},
  {tag:'People-Pleaser',drama:-2,abuse:-5,mat:-1},
  {tag:'Blunt',drama:3,abuse:2,mat:2},
  {tag:'Idealistic',drama:-4,abuse:-3,mat:2},
  {tag:'Cynical',drama:2,abuse:1,mat:1},
  {tag:'Team Player',drama:-6,abuse:-4,mat:4},
  {tag:'Impulsive',drama:8,abuse:5,mat:-5},
  {tag:'Methodical',drama:-3,abuse:0,mat:5},
  {tag:'Territorial',drama:5,abuse:4,mat:-2},
  {tag:'Nurturing',drama:-7,abuse:-6,mat:5}
];

SO.FOCI = ['Chat Moderation','Technical Support','Community Events','Bug Triage','New Player Support','Content Review'];

SO.GOAL_DREAM_TEMPLATES = [
  'Dreams of making {R} one day',
  'Quietly hopes to become {R} eventually',
  'Has their sights set on {R}',
  'Wants nothing more than to be promoted to {R}',
  'Has been telling everyone they will make {R} by year end'
];
SO.GENERIC_GOALS = [
  'Just wants free perks and a cool tag',
  'Genuinely cares about the community',
  'Craves power and control over others',
  'Wants to make friends on the team',
  "Padding a resume, doesn't care much beyond that",
  "Doesn't care about rank, just enjoys the work",
  'Wants real recognition for the hours put in',
  'Burnt out and mostly coasting at this point',
  'Mostly here for the friend group, work is secondary',
  'Happy right where they are',
  'Trying to outlast everyone else on the team',
  'Wants to build something they can point to later',
  'Secretly wants your job'
];

SO.INCIDENT_TEMPLATES = {
  minor:[
    "{n} got into a long, heated argument over which game genre is objectively superior in staff chat.",
    "{n} posted a slightly cringe-worthy meme in the announcements channel by mistake.",
    "{n} has been a bit short with new members lately, nothing serious, but a few have noticed.",
    "{n} accidentally pinged the entire server while testing a command.",
    "{n} has been oversharing personal drama in the staff lounge.",
    "{n} got called out for an oddly intense rant about pineapple on pizza.",
    "{n} showed up late to three staff meetings in a row.",
    "{n} kept arguing with a member long after the point was settled.",
    "{n} confidently misquoted a game patch note and refused to back down.",
    "{n} spammed the staff channel with low-effort reaction gifs during a serious discussion.",
    "{n} got into a petty argument over Discord role colors.",
    "{n} forgot to log off mod-only tools after their shift, again.",
    "{n} started an unnecessary poll about renaming a channel that nobody asked for.",
    "{n} left a slightly passive-aggressive note in the shift handoff log.",
    "{n} got mildly competitive about response times and started subtweeting about it.",
    "{n} accidentally announced a joke ban in the wrong channel."
  ],
  moderate:[
    "{n} muted a member for 24 hours over what looks like a personal disagreement, not a real rule break.",
    "{n} handed out a warning that several members feel was unfair and biased.",
    "{n} has been a little heavy-handed with timeouts this week, multiple appeals are piling up.",
    "{n} used mod tools to settle a private argument with another staff member.",
    "{n} deleted a few messages that didn't break any rules, just because they found them annoying.",
    "{n} played favorites, letting their friends slide on rules others get punished for.",
    "{n} gave a friend a role they hadn't earned yet.",
    "{n} vented about a member by name in a semi-public channel.",
    "{n} skipped the usual warning step and went straight to punishment.",
    "{n} let a heated personal beef spill into how they moderated someone.",
    "{n} took credit for another staffer's moderation work in a public thank-you post.",
    "{n} quietly overturned a colleague's ban without discussing it with anyone.",
    "{n} has been screenshotting private staff conversations to use as leverage in arguments."
  ],
  major:[
    "{n} was caught using a slur in a 'private' staff voice channel that got recorded.",
    "{n} has been actively harassing a specific member for days, using mod powers to silence any pushback.",
    "{n} banned several normal users without cause, apparently just to feel powerful.",
    "{n} was screenshotted bullying a newer staff member in DMs.",
    "{n} abused admin tools to spy on and leak a member's private messages.",
    "{n} threatened a member off-platform after a dispute that started in the server.",
    "{n} doxxed a member during an argument that got out of hand.",
    "{n} was caught running a side scheme using insider mod access.",
    "{n} encouraged other staff to gang up on a member they disliked.",
    "{n} retaliated against a member who reported them, using mod tools to do it.",
    "{n} was caught selling in-game advantages using their access to internal tools.",
    "{n} coerced a newer staff member into covering up a rule violation.",
    "{n} leaked unreleased server plans to a rival community out of spite."
  ]
};

SO.COMMENDATION_TEMPLATES = [
  "{n} talked a panicking new member through a scary bug report calmly and clearly.",
  "{n} wrote up a genuinely useful onboarding guide for new staff, unprompted.",
  "{n} de-escalated a huge server-wide argument before it turned into a pile-on.",
  "{n} caught and reported a real exploit before it spread.",
  "{n} stayed two extra hours to help cover an unexpected staffing gap.",
  "{n} got a heartfelt thank-you message from a member they helped through a rough situation.",
  "{n} organized a well-received community event completely on their own initiative.",
  "{n} quietly mentored a struggling new mod without ever being asked to.",
  "{n} handled an extremely hostile member with patience that impressed everyone watching.",
  "{n} flagged a colleague's mistake privately and kindly instead of publicly embarrassing them.",
  "{n} spotted a pattern of coordinated rule-breaking that had been missed for weeks."
];

SO.DISRUPTION_TYPES = {
  massLoA:{label:'Mass Leave of Absence',desc:'A wave of staff have stepped away for a few days, effective capacity is down.',duration:[5,5]},
  busyTiffa:{label:'Busy Tiffa',desc:"Tiffa is swamped and won't pitch Staff News or auto-act for a while. You're on your own.",duration:[7,14]},
  dramaWildfire:{label:'Drama Wildfire',desc:'Gossip is spreading fast across the team and drama keeps creeping up.',duration:[3,6]},
  serverSpotlight:{label:'Server Spotlight',desc:'Your server got featured somewhere and new players are flooding in.',duration:[4,8]},
  budgetCrunch:{label:'Budget Crunch',desc:'Ad revenue dipped hard. Budget income is reduced for a while.',duration:[5,9]},
  viralClip:{label:'Viral Clip',desc:'A funny moment from your server went viral. Population is surging and budget income is up.',duration:[3,5]},
  ddosScare:{label:'DDoS Scare',desc:'The server has been under intermittent attack. Drama and incident rates are elevated until it\'s resolved.',duration:[2,4]},
  holidaySeason:{label:'Holiday Season',desc:'Everyone is in a good mood. Satisfaction decays toward a higher baseline for a while.',duration:[6,10]}
};

SO.LEGENDARIES = [
  {name:'GermanLightning7', chance:1.0, rank:2, hours:30, traits:['Natural Mentor','Genuinely Caring','Hypocritical','Strict'], goal:'Desperately, deeply craves becoming Head Admin one day', dreamRank:5, maturityHidden:85, dramaTendency:28, abuseTendency:14, weeksInRank:6, bio:'A mature, natural leader who genuinely cares and mentors juniors without being asked. Puts in huge hours. Underneath it, emotionally insecure, holds others to standards he quietly breaks himself, and runs a tighter ship than he\u2019d ever admit to.'},
  {name:'John Persona', chance:1.0, rank:3, hours:4, traits:['Encyclopedic','Sarcastic','Toxic'], goal:'Dreams of finally making Supervisor', dreamRank:4, maturityHidden:98, dramaTendency:25, abuseTendency:20, weeksInRank:160, bio:'Extremely mature on paper and almost never causes problems, but barely shows up anymore. Immense institutional knowledge of the server. Privately a bit of a toxic jerk, which is probably exactly why he\u2019s been passed over for Supervisor despite more seniority than anyone else on the team.'},
  {name:'Kaito', chance:1.0, rank:3, hours:10, traits:['Encyclopedic','Stoic','Untrustworthy'], goal:'Quietly dreams of becoming Head Admin', dreamRank:5, maturityHidden:80, dramaTendency:15, abuseTendency:12, weeksInRank:190, bio:'Seems to know everything, stays calm under pressure, and is immensely senior. The kind of person other staff quietly look up to, though those who\u2019ve worked closest with him aren\u2019t so sure he can actually be trusted.'},
  {name:'MossAndMarrow', chance:0.6, rank:1, hours:14, traits:['Natural Mentor','Nurturing','Diplomatic'], goal:'Just wants the team to function well as a family', dreamRank:3, maturityHidden:72, dramaTendency:10, abuseTendency:4, weeksInRank:20, bio:'Unusually gentle for how much responsibility they quietly take on. Other staff bring their problems to them before they bring them to you.'}
];
