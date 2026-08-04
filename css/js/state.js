var SO = window.SO = window.SO || {};

SO.G = null;
SO.staffIdSeq = 1;
SO.SAVE_KEY = 'serverops_save_v1';

SO.clamp = function(x,a,b){return Math.max(a,Math.min(b,x));};
SO.randInt = function(a,b){return Math.floor(Math.random()*(b-a+1))+a;};
SO.randPick = function(arr){return arr[Math.floor(Math.random()*arr.length)];};
SO.pct = function(x){return Math.round(SO.clamp(x,0,100));};

SO.makeName = function(used){
  var n, tries=0;
  do{
    n = SO.randPick(SO.NAME_PREFIX)+SO.randPick(SO.NAME_SUFFIX)+SO.randPick(SO.NAME_DECOR);
    tries++;
  } while(used.has(n) && tries<300);
  used.add(n);
  return n;
};

SO.genStaff = function(rank, used){
  var picks = [];
  var pool = SO.PERSONALITY_POOL.slice();
  for(var i=0;i<2;i++){
    var idx = SO.randInt(0,pool.length-1);
    picks.push(pool[idx]);
    pool.splice(idx,1);
  }
  var mr = SO.MATURITY_BASE_RANGE[rank];
  var maturity = SO.randInt(mr[0],mr[1]);
  var dramaT = SO.randInt(10,45);
  var abuseT = SO.randInt(2,30);
  picks.forEach(function(p){maturity+=p.mat;dramaT+=p.drama;abuseT+=p.abuse;});
  var hr = SO.HOURS_RANGE[rank];

  var dreamRank = null;
  if(rank<4 && Math.random()<0.8){ dreamRank = SO.randInt(rank+1,4); }
  var goal = dreamRank!=null ? SO.randPick(SO.GOAL_DREAM_TEMPLATES).replace('{R}',SO.RANKS[dreamRank]) : SO.randPick(SO.GENERIC_GOALS);
  var finalMaturity = SO.clamp(maturity, SO.MATURITY_FLOOR[rank], 99);
  var startSat = SO.randInt(45,75);
  var startLoy = SO.randInt(45,75);
  var startDrama = SO.randInt(5,30);

  var s = {
    id: SO.staffIdSeq++,
    username: SO.makeName(used),
    rank: rank,
    focus: rank>=1 ? SO.randPick(SO.FOCI) : null,
    hoursPerWeek: SO.randInt(hr[0],hr[1]),
    baseHoursPerWeek: 0,
    daysInRank: SO.randInt(0,45),
    traits: picks.map(function(p){return p.tag;}),
    goal: goal,
    dreamRank: dreamRank,
    dreamAchieved: false,
    ascended: false,
    goldenStat: null,
    maturityHidden: finalMaturity,
    maturityBaseline: finalMaturity,
    dramaTendency: SO.clamp(dramaT,0,100),
    abuseTendency: SO.clamp(abuseT,0,100),
    loyalty: startLoy,
    satisfaction: startSat,
    drama: startDrama,
    maturitySnapshot: finalMaturity,
    dramaSnapshot: startDrama,
    satisfactionSnapshot: startSat,
    snapshotDay: SO.randInt(1,7),
    revealLevel: 0,
    status: 'active',
    legendary: null,
    riskyPromotion: false,
    warnedCount:0,
    commendations:0,
    restrictedUntil: 0,
    lastPraiseDay: -99,
    lastTimeOffDay: -99,
    timeOffUntil: 0,
    lowSatStreak: 0,
    queued: null,
    bio: null,
    mentorId: null,
    menteeId: null,
    pendingAppeal: null
  };
  s.baseHoursPerWeek = s.hoursPerWeek;
  return s;
};

SO.applyLegendary = function(s, leg){
  s.username = leg.name;
  s.rank = leg.rank;
  s.focus = SO.randPick(SO.FOCI);
  s.hoursPerWeek = leg.hours;
  s.baseHoursPerWeek = leg.hours;
  s.traits = leg.traits.slice();
  s.goal = leg.goal;
  s.dreamRank = leg.dreamRank;
  s.maturityHidden = leg.maturityHidden;
  s.maturityBaseline = leg.maturityHidden;
  s.dramaTendency = leg.dramaTendency;
  s.abuseTendency = leg.abuseTendency;
  s.daysInRank = leg.weeksInRank*7;
  s.loyalty = 60; s.satisfaction = 60; s.drama = 15;
  s.maturitySnapshot = leg.maturityHidden;
  s.dramaSnapshot = 15;
  s.satisfactionSnapshot = 60;
  s.snapshotDay = SO.randInt(1,7);
  s.legendary = leg.name;
  s.bio = leg.bio;
  return s;
};

SO.activeStaff = function(){return SO.G.staff.filter(function(s){return s.status==='active';});};
SO.byId = function(id){return SO.G.staff.find(function(s){return s.id===id;});};
SO.hasDisruption = function(type){ return SO.G.disruptions.some(function(d){return d.type===type;}); };
SO.currentSupervisors = function(){ return SO.activeStaff().filter(function(s){return s.rank===4;}).length; };
SO.requiredSupervisors = function(){ return Math.max(1, Math.ceil(SO.activeStaff().length/40)); };
SO.computeCapacity = function(){
  var cap=0;
  SO.activeStaff().forEach(function(s){cap+=SO.CAPACITY_PER_RANK[s.rank]||0;});
  var mult = SO.hasDisruption('massLoA') ? 0.8 : 1;
  return Math.round(cap*mult);
};

SO.newGame = function(serverName, ownerName, difficulty){
  SO.staffIdSeq = 1;
  var used = new Set();
  var staff = [];
  for(var r=0;r<6;r++){
    for(var i=0;i<SO.START_COUNTS[r];i++){
      staff.push(SO.genStaff(r, used));
    }
  }
  SO.LEGENDARIES.forEach(function(leg){
    if(Math.random() < leg.chance){
      var candidates = staff.filter(function(s){return s.rank===leg.rank;});
      if(candidates.length){
        var target = SO.randPick(candidates);
        SO.applyLegendary(target, leg);
      }
    }
  });

  SO.G = {
    serverName: serverName || 'Unnamed Server',
    ownerName: ownerName || 'Boss',
    difficulty: difficulty || 'standard',
    day: 1,
    staff: staff,
    draftNews: [],
    log: [],
    incidentsToday: [],
    pendingIncidents: [],
    majorPopupQueue: [],
    disruptions: [],
    elections: [],
    serverPopulation: 0,
    budget: 400,
    investigateLeft: 4,
    eventCooldownUntil: 0,
    awaitingNews: false,
    aboveThreshold: false,
    meters:{loyalty:0,satisfaction:0,drama:0},
    tiffa: {
      autopilot: false,
      promoteCriteria: {
        0:{minWeeks:3,minHours:4,minMaturity:0},
        1:{minWeeks:4,minHours:5,minMaturity:50},
        2:{minWeeks:5,minHours:6,minMaturity:55},
        3:{minWeeks:6,minHours:8,minMaturity:60},
        4:{minWeeks:8,minHours:10,minMaturity:65}
      },
      demoteCriteria: {
        1:{enabled:true,minHours:1,maxDrama:75},
        2:{enabled:true,minHours:2,maxDrama:75},
        3:{enabled:true,minHours:2,maxDrama:70},
        4:{enabled:true,minHours:2,maxDrama:65},
        5:{enabled:true,minHours:2,maxDrama:60}
      },
      pitch: [],
      notifications: [],
      unread: 0
    },
    stats:{promotions:0,demotions:0,terminations:0,warnings:0,restrictions:0,quits:0,tiffaActions:0,minorHandled:0,moderateHandled:0,majorHandled:0,ignored:0,commendationsGiven:0,appealsOverturned:0,recruited:0}
  };
  SO.G.serverPopulation = Math.round(SO.computeCapacity()*0.85);
  staff.forEach(function(s){ SO.checkDream(s); });
  SO.recomputeMeters();
  SO.checkHeadAdminImmediate();
  SO.addLog('You take the desk at '+SO.G.serverName+'. '+SO.activeStaff().length+' staff are watching to see what kind of owner you are.','good');
};

SO.addLog = function(text,type){
  SO.G.log.unshift({day:SO.G.day,text:text,type:type||'info'});
  if(SO.G.log.length>400) SO.G.log.pop();
};
SO.pushTiffaNotif = function(text){
  var who = (SO.G && SO.G.ownerName) ? SO.G.ownerName : 'Boss';
  SO.G.tiffa.notifications.unshift({day:SO.G.day,text:'@'+who+', '+text});
  if(SO.G.tiffa.notifications.length>120) SO.G.tiffa.notifications.pop();
  SO.G.tiffa.unread = (SO.G.tiffa.unread||0)+1;
};
SO.toast = function(msg,type){
  var root = document.getElementById('toastRoot');
  var el = document.createElement('div');
  el.className = 'toast'+(type==='warn'?' t-warn':type==='danger'?' t-danger':type==='good'?' t-good':'');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(function(){el.remove();},5200);
};

SO.recomputeMeters = function(){
  var a = SO.activeStaff();
  if(!a.length){SO.G.meters={loyalty:0,satisfaction:0,drama:0};return;}
  var l=0,s=0,d=0;
  a.forEach(function(x){l+=x.loyalty;s+=x.satisfaction;d+=x.drama;});
  SO.G.meters = {
    loyalty: SO.pct(l/a.length),
    satisfaction: SO.pct(s/a.length),
    drama: SO.pct(d/a.length)
  };
};

SO.checkHeadAdminImmediate = function(){
  var hasHA = SO.activeStaff().some(function(s){return s.rank===5;});
  var present = SO.hasDisruption('noHeadAdmin');
  if(!hasHA && !present){
    SO.G.disruptions.push({type:'noHeadAdmin', label:'No Head Admin', desc:'There is no Head Admin in place. Morale is low, satisfaction is stagnant, and drama may creep up until one is elected.', startDay:SO.G.day, endDay:null});
    SO.addLog('With no Head Admin in place, the team is rattled.','danger');
    SO.triggerElection(5);
  } else if(hasHA && present){
    SO.G.disruptions = SO.G.disruptions.filter(function(d){return d.type!=='noHeadAdmin';});
    SO.addLog('A Head Admin is back in place. The team breathes a sigh of relief.','good');
  }
};

SO.saveGame = function(){
  try{
    localStorage.setItem(SO.SAVE_KEY, JSON.stringify(SO.G));
    return true;
  }catch(e){ return false; }
};
SO.hasSave = function(){
  try{ return !!localStorage.getItem(SO.SAVE_KEY); }catch(e){ return false; }
};
SO.loadGame = function(){
  try{
    var raw = localStorage.getItem(SO.SAVE_KEY);
    if(!raw) return false;
    SO.G = JSON.parse(raw);
    var maxId = 0;
    SO.G.staff.forEach(function(s){ if(s.id>maxId) maxId=s.id; });
    SO.staffIdSeq = maxId+1;
    return true;
  }catch(e){ return false; }
};
