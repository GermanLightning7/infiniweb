
var SO = window.SO = window.SO || {};

SO.weekdayName = function(day){
  var names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  return names[(day-1)%7];
};
SO.weekdayIdx = function(day){return (day-1)%7;};
SO.isMonday = function(){return SO.weekdayIdx(SO.G.day)===0;};
SO.diffPreset = function(){ return SO.DIFFICULTY_PRESETS[SO.G.difficulty] || SO.DIFFICULTY_PRESETS.standard; };

SO.checkWinCondition = function(){
  var met = SO.G.meters.loyalty>=98 && SO.G.meters.satisfaction>=98 && SO.G.meters.drama<=2;
  if(met && !SO.G.aboveThreshold){
    SO.G.aboveThreshold = true;
    SO.openEndingModal();
  } else if(!met){
    SO.G.aboveThreshold = false;
  }
};

SO.checkDream = function(s){
  if(s.dreamRank==null) return;
  if(s.rank>=s.dreamRank){
    if(!s.dreamAchieved){
      s.dreamAchieved = true;
      if(!s.goldenStat) s.goldenStat = Math.random()<0.5 ? 'loyalty' : 'satisfaction';
      s.maturityHidden = SO.clamp(s.maturityHidden+2,3,99);
      SO.addLog(s.username+"'s dream came true, they made "+SO.RANKS[s.rank]+"!",'good');
    }
    s[s.goldenStat] = 100;
    if(s.rank>s.dreamRank && !s.ascended){
      s.ascended = true;
      SO.addLog(s.username+' has gone beyond their wildest dreams.','good');
    }
  }
};

/* ---------- Disruptions ---------- */
SO.tickDisruptions = function(){
  SO.G.disruptions = SO.G.disruptions.filter(function(d){
    if(d.type!=='noHeadAdmin' && d.endDay!=null && SO.G.day>=d.endDay){
      SO.addLog('The "'+d.label+'" situation has resolved.','good');
      return false;
    }
    return true;
  });
  SO.checkHeadAdminImmediate();
  if(Math.random()<0.025){
    var keys = Object.keys(SO.DISRUPTION_TYPES).filter(function(k){
      return !SO.G.disruptions.some(function(d){return d.type===k;});
    });
    if(keys.length){
      var key = SO.randPick(keys);
      var def = SO.DISRUPTION_TYPES[key];
      var dur = SO.randInt(def.duration[0],def.duration[1]);
      SO.G.disruptions.push({type:key,label:def.label,desc:def.desc,startDay:SO.G.day,endDay:SO.G.day+dur});
      SO.addLog('New situation: '+def.label+'. '+def.desc,'warn');
      SO.toast(def.label+' has begun.','warn');
    }
  }
};

/* ---------- Budget ---------- */
SO.tickBudget = function(){
  var mult = SO.diffPreset().budgetMult;
  var income = SO.G.serverPopulation*0.012*mult;
  if(SO.hasDisruption('budgetCrunch')) income *= 0.4;
  if(SO.hasDisruption('viralClip')) income *= 1.8;
  SO.G.budget = Math.round(SO.clamp(SO.G.budget+income, 0, 99999));
};

/* ---------- Population ---------- */
SO.tickPopulation = function(coverageRatio, supShortfall){
  var growth;
  if(SO.G.meters.loyalty>=60 && SO.G.meters.satisfaction>=60 && SO.G.meters.drama<=30 && coverageRatio<=1.0 && supShortfall<=0){
    growth = 0.006;
  } else if(SO.G.meters.satisfaction<35 || SO.G.meters.drama>60 || coverageRatio>1.3){
    growth = -0.012;
  } else {
    growth = 0.0005;
  }
  if(SO.hasDisruption('serverSpotlight')) growth += 0.02;
  if(SO.hasDisruption('viralClip')) growth += 0.03;
  SO.G.serverPopulation = SO.clamp(Math.round(SO.G.serverPopulation*(1+growth)), 50, 20000);
};

/* ---------- Day cycle ---------- */
SO.incidentChance = function(s, globalMult){
  var base = 0.014 * [1.3,1.1,0.9,0.75,0.5,0.35][s.rank];
  var mod = 1 + (100-s.satisfaction)/150 + (s.dramaTendency-50)/150;
  if(s.restrictedUntil>=SO.G.day) mod -= 0.45;
  if(s.riskyPromotion) mod += 0.3;
  if(s.warnedCount>=3) mod += 0.15;
  if(s.mentorId) mod -= 0.15;
  mod *= (globalMult||1);
  mod *= SO.diffPreset().incidentMult;
  return SO.clamp(base*mod, 0.001, 0.5);
};
SO.commendationChance = function(s){
  var base = 0.01 + s.maturityHidden/4000 + (s.satisfaction>70?0.006:0);
  if(s.mentorId || s.menteeId) base += 0.004;
  return SO.clamp(base, 0.001, 0.06);
};
SO.rollSeverity = function(s){
  var majorW = Math.max(0.3, 4 + s.abuseTendency/8 - s.rank*1.5);
  var modW = Math.max(2, 22 + s.abuseTendency/5 - s.rank*2);
  var minW = 100;
  var total = minW+modW+majorW;
  var r = Math.random()*total;
  if(r<majorW) return 'major';
  if(r<majorW+modW) return 'moderate';
  return 'minor';
};

SO.endDay = function(){
  if(SO.G.awaitingNews || SO.G.majorPopupQueue.length) return;
  if(document.querySelector('.modal-backdrop.blocking')) return;

  SO.tickDisruptions();

  var cap = SO.computeCapacity();
  var coverageRatio = cap>0 ? SO.G.serverPopulation/cap : 0;
  var supShortfall = Math.max(0, SO.requiredSupervisors()-SO.currentSupervisors());
  var globalMult = 1 + Math.max(0,coverageRatio-1)*0.5 + supShortfall*0.12 + (SO.hasDisruption('ddosScare')?0.35:0);
  var noHA = SO.hasDisruption('noHeadAdmin');
  var wildfire = SO.hasDisruption('dramaWildfire') || SO.hasDisruption('ddosScare');
  var holidayBonus = SO.hasDisruption('holidaySeason') ? 8 : 0;
  var diffDecay = SO.diffPreset().dramaDecayBonus;
  var quitLen = SO.diffPreset().quitLenience;

  SO.activeStaff().forEach(function(s){
    s.daysInRank++;
    if(s.timeOffUntil>0 && SO.G.day>=s.timeOffUntil){ s.hoursPerWeek = s.baseHoursPerWeek; s.timeOffUntil=0; }
    if(s.revealLevel<3 && Math.random()<0.05) s.revealLevel++;

    var noise = (Math.random()*2-1);
    var pressurePenalty = Math.max(0,coverageRatio-1)*1.3 + supShortfall*0.3 + (noHA?0.4:0);

    s.satisfaction = SO.clamp(s.satisfaction + (58+holidayBonus-s.satisfaction)*0.05 - pressurePenalty + noise*0.4, 0,100);
    s.loyalty = SO.clamp(s.loyalty + (58-s.loyalty)*0.045 - pressurePenalty*0.6 - (noHA?0.2:0) + noise*0.3, 0,100);

    var personalDramaBaseline = SO.clamp(s.dramaTendency*0.22, 1, 35);
    s.drama = SO.clamp(s.drama + (personalDramaBaseline-s.drama)*(0.06+diffDecay) + noise*0.2 + (wildfire?0.6:0) + (noHA && Math.random()<0.3 ? 0.3:0), 0,100);

    s.maturityHidden = SO.clamp(s.maturityHidden + (s.maturityBaseline-s.maturityHidden)*0.02 + (Math.random()*2-1)*0.25, 3, 99);

    // Mentorship effects
    if(s.menteeId){
      var mentee = SO.byId(s.menteeId);
      if(mentee && mentee.status==='active'){
        mentee.maturityHidden = SO.clamp(mentee.maturityHidden + 0.35, 3, 99);
        s.satisfaction = SO.clamp(s.satisfaction+0.3,0,100);
        s.loyalty = SO.clamp(s.loyalty+0.2,0,100);
      } else { s.menteeId = null; }
    }
    if(s.mentorId){
      var mentor = SO.byId(s.mentorId);
      if(!mentor || mentor.status!=='active'){ s.mentorId = null; }
    }

    if(s.goldenStat && s.dreamRank!=null && s.rank>=s.dreamRank){ s[s.goldenStat] = 100; }

    if(s.satisfaction<15){
      s.lowSatStreak++;
      var chanceQuit = Math.min(0.30, s.lowSatStreak*0.04*quitLen);
      if(Math.random()<chanceQuit){
        var wasHA0 = s.rank===5;
        s.status='quit';
        SO.G.stats.quits++;
        SO.addLog(s.username+' ('+SO.RANKS[s.rank]+') quit the team, burnt out and unappreciated.','danger');
        if(s.mentorId){ var m0=SO.byId(s.mentorId); if(m0) m0.menteeId=null; }
        if(s.menteeId){ var m1=SO.byId(s.menteeId); if(m1) m1.mentorId=null; }
        SO.activeStaff().forEach(function(o){o.loyalty=SO.clamp(o.loyalty-2,0,100);o.satisfaction=SO.clamp(o.satisfaction-2,0,100);o.drama=SO.clamp(o.drama+3,0,100);});
        if(wasHA0) SO.checkHeadAdminImmediate();
      }
    } else {
      s.lowSatStreak = 0;
    }
  });

  // Incidents & commendations
  SO.G.incidentsToday = [];
  var newMajors = [];
  SO.activeStaff().forEach(function(s){
    if(s.status!=='active') return;
    var chance = SO.incidentChance(s, globalMult);
    if(Math.random()<chance){
      var sev = SO.rollSeverity(s);
      var tmpl = SO.randPick(SO.INCIDENT_TEMPLATES[sev]);
      var desc = tmpl.replace('{n}', s.username);
      var inc = {id:'i'+(SO.staffIdSeq++)+'_'+Math.random().toString(36).slice(2,7), staffId:s.id, day:SO.G.day, severity:sev, desc:desc, handled:false, evidence: s.revealLevel};
      s.revealLevel = Math.min(3, s.revealLevel + (sev==='major'?2:1));
      if(sev==='major'){ newMajors.push(inc); }
      else { SO.G.incidentsToday.push(inc); SO.G.pendingIncidents.push(inc); }
    } else if(Math.random()<SO.commendationChance(s)){
      var ctmpl = SO.randPick(SO.COMMENDATION_TEMPLATES);
      var cdesc = ctmpl.replace('{n}', s.username);
      var cinc = {id:'c'+(SO.staffIdSeq++)+'_'+Math.random().toString(36).slice(2,7), staffId:s.id, day:SO.G.day, severity:'commend', desc:cdesc, handled:false};
      SO.G.pendingIncidents.push(cinc);
    }
  });
  SO.G.majorPopupQueue = SO.G.majorPopupQueue.concat(newMajors);

  SO.tickAppeals();
  SO.runTiffa();
  SO.tiffaInsightScan();
  SO.recomputeMeters();
  SO.tickPopulation(coverageRatio, supShortfall);
  SO.tickBudget();
  SO.checkWinCondition();

  SO.G.day++;
  SO.G.investigateLeft = 4;

  if(SO.weekdayIdx(SO.G.day)===0){
    SO.G.tiffa.pitch = (SO.G.tiffa.autopilot || SO.hasDisruption('busyTiffa')) ? [] : SO.computeTiffaRecommendations();
    SO.G.awaitingNews = true;
  }

  SO.renderAll();
  if(SO.G.majorPopupQueue.length){
    SO.openMajorIncidentModal();
  } else if(SO.G.elections.length){
    SO.openElectionModal(SO.G.elections[0].id);
  } else if(SO.G.awaitingNews){
    SO.openMondayModal();
  }
};

SO.advanceQueueOrMonday = function(){
  if(SO.G.majorPopupQueue.length){ SO.openMajorIncidentModal(); return; }
  if(SO.G.elections.length){ SO.openElectionModal(SO.G.elections[0].id); return; }
  if(SO.G.awaitingNews){ SO.openMondayModal(); return; }
  SO.closeModal();
};

/* ---------- Personnel actions ---------- */
SO.orgShock = function(dLoy,dSat,dDra){
  SO.activeStaff().forEach(function(s){
    s.loyalty = SO.clamp(s.loyalty+dLoy,0,100);
    s.satisfaction = SO.clamp(s.satisfaction+dSat,0,100);
    s.drama = SO.clamp(s.drama+dDra,0,100);
  });
  SO.recomputeMeters();
};

SO.doPromote = function(s, opts){
  opts = opts||{};
  if(s.rank>=5) return;
  var risky = (SO.isRevealed(s,'maturity') && s.maturityHidden<40) || s.hoursPerWeek<5;
  s.rank++;
  s.daysInRank = 0;
  s.loyalty = SO.clamp(s.loyalty+12,0,100);
  s.satisfaction = SO.clamp(s.satisfaction+10,0,100);
  s.drama = SO.clamp(s.drama-5,0,100);
  if(risky){
    s.riskyPromotion = true;
    s.abuseTendency = SO.clamp(s.abuseTendency+15,0,100);
    s.dramaTendency = SO.clamp(s.dramaTendency+10,0,100);
    s.maturityHidden = SO.clamp(s.maturityHidden-3,3,99);
  } else {
    s.riskyPromotion = false;
    s.maturityHidden = SO.clamp(s.maturityHidden+1,3,99);
  }
  SO.checkDream(s);
  if(s.rank===5) SO.checkHeadAdminImmediate();
  if(s.rank===4) SO.G.elections = SO.G.elections.filter(function(e){return e.rank!==4 || SO.currentSupervisors()>=SO.requiredSupervisors();});
  SO.G.stats.promotions++;
  if(opts.emergency){ SO.orgShock(0,0,3); }
  if(!opts.silent) SO.addLog((opts.by||'You')+' promoted '+s.username+' to '+SO.RANKS[s.rank]+'.','good');
};

SO.doDemote = function(s, opts){
  opts = opts||{};
  if(s.rank<=0) return;
  var wasHA = s.rank===5;
  var thinEvidence = s.revealLevel<2;
  s.rank--;
  s.daysInRank = 0;
  s.loyalty = SO.clamp(s.loyalty-15,0,100);
  s.satisfaction = SO.clamp(s.satisfaction-12,0,100);
  s.drama = SO.clamp(s.drama+8,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden-1.5,3,99);
  if(wasHA) SO.checkHeadAdminImmediate();
  SO.G.stats.demotions++;
  if(opts.emergency){ SO.orgShock(0,0,3); }
  if(opts.justified){ SO.orgShock(1,1,-1); }
  if(!opts.silent) SO.addLog((opts.by||'You')+' demoted '+s.username+' to '+SO.RANKS[s.rank]+'.','warn');
  if(!opts.silent && thinEvidence && Math.random()<0.35){ SO.queueAppeal(s, 'demote', s.rank+1); }
};

SO.doTerminate = function(s, opts){
  opts = opts||{};
  var wasHA = s.rank===5;
  var thinEvidence = s.revealLevel<2;
  s.status = 'terminated';
  SO.G.stats.terminations++;
  if(s.mentorId){ var m0=SO.byId(s.mentorId); if(m0) m0.menteeId=null; }
  if(s.menteeId){ var m1=SO.byId(s.menteeId); if(m1) m1.mentorId=null; }
  if(opts.justified){
    SO.orgShock(3,4,-14);
    SO.addLog('You removed '+s.username+' from staff for cause. The team feels the relief.','good');
  } else {
    SO.orgShock(-2,-3,9);
    SO.addLog('You removed '+s.username+' from staff without clear cause. It raised some eyebrows.','warn');
    if(thinEvidence && Math.random()<0.25){ SO.toast('That termination is being quietly questioned by the team.','warn'); }
  }
  if(wasHA) SO.checkHeadAdminImmediate();
};

SO.doWarn = function(s){
  s.satisfaction = SO.clamp(s.satisfaction-4,0,100);
  s.loyalty = SO.clamp(s.loyalty-2,0,100);
  s.drama = SO.clamp(s.drama-6,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden-0.6,3,99);
  s.warnedCount++;
  SO.G.stats.warnings++;
  SO.addLog('You warned '+s.username+'.','warn');
};
SO.doRestrict = function(s){
  s.restrictedUntil = SO.G.day+3;
  s.satisfaction = SO.clamp(s.satisfaction-6,0,100);
  s.loyalty = SO.clamp(s.loyalty-3,0,100);
  s.drama = SO.clamp(s.drama-4,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden-0.4,3,99);
  SO.G.stats.restrictions++;
  SO.addLog('You restricted '+s.username+"'s mod powers for a few days.",'warn');
};
SO.doIgnore = function(s){
  s.drama = SO.clamp(s.drama+5,0,100);
  s.satisfaction = SO.clamp(s.satisfaction-2,0,100);
  s.dramaTendency = SO.clamp(s.dramaTendency+4,0,100);
  SO.G.stats.ignored++;
  SO.addLog('You looked the other way on a report about '+s.username+'.','warn');
};
SO.doBrushOff = function(s){
  s.drama = SO.clamp(s.drama-1,0,100);
  s.satisfaction = SO.clamp(s.satisfaction+1,0,100);
};
SO.doCommend = function(s){
  s.commendations++;
  s.loyalty = SO.clamp(s.loyalty+7,0,100);
  s.satisfaction = SO.clamp(s.satisfaction+8,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden+0.5,3,99);
  SO.G.stats.commendationsGiven++;
  SO.addLog('You commended '+s.username+' for good work.','good');
};
SO.doInvestigate = function(s){
  if(SO.G.investigateLeft<=0) return false;
  SO.G.investigateLeft--;
  s.revealLevel = Math.min(3, s.revealLevel+1);
  s.satisfaction = SO.clamp(s.satisfaction+2,0,100);
  s.loyalty = SO.clamp(s.loyalty+1,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden+0.4,3,99);
  SO.addLog('You checked in with '+s.username+'.','info');
  return true;
};
SO.doPraise = function(s){
  if(s.lastPraiseDay===SO.G.day) return false;
  s.lastPraiseDay = SO.G.day;
  s.loyalty = SO.clamp(s.loyalty+5,0,100);
  s.satisfaction = SO.clamp(s.satisfaction+6,0,100);
  s.drama = SO.clamp(s.drama-2,0,100);
  s.maturityHidden = SO.clamp(s.maturityHidden+0.3,3,99);
  SO.addLog('You praised '+s.username+' for their work.','good');
  return true;
};
SO.doTimeOff = function(s){
  if(SO.G.day - s.lastTimeOffDay < 7) return false;
  s.lastTimeOffDay = SO.G.day;
  s.timeOffUntil = SO.G.day+3;
  s.hoursPerWeek = Math.max(1, Math.round(s.baseHoursPerWeek*0.3));
  s.satisfaction = SO.clamp(s.satisfaction+15,0,100);
  s.loyalty = SO.clamp(s.loyalty+3,0,100);
  s.lowSatStreak = 0;
  SO.addLog('You gave '+s.username+' some time off.','good');
  return true;
};

SO.BONUS_COST = 60;
SO.doBonusPay = function(s){
  if(SO.G.budget < SO.BONUS_COST) return false;
  SO.G.budget -= SO.BONUS_COST;
  s.satisfaction = SO.clamp(s.satisfaction+12,0,100);
  s.loyalty = SO.clamp(s.loyalty+8,0,100);
  SO.addLog('You gave '+s.username+' a bonus. ($'+SO.BONUS_COST+')','good');
  return true;
};

SO.EVENT_COST = 150;
SO.hostAppreciationEvent = function(){
  if(SO.G.day < SO.G.eventCooldownUntil) return false;
  if(SO.G.budget < SO.EVENT_COST) return false;
  SO.G.budget -= SO.EVENT_COST;
  SO.G.eventCooldownUntil = SO.G.day+5;
  SO.activeStaff().forEach(function(s){
    s.satisfaction = SO.clamp(s.satisfaction+8,0,100);
    s.loyalty = SO.clamp(s.loyalty+4,0,100);
    s.drama = SO.clamp(s.drama-6,0,100);
    s.lowSatStreak = 0;
  });
  SO.recomputeMeters();
  SO.checkWinCondition();
  SO.addLog('You hosted a staff appreciation event ($'+SO.EVENT_COST+'). Spirits are up across the team.','good');
  SO.toast('Staff appreciation event hosted, morale rising.','good');
  return true;
};

SO.RECRUIT_COST = 90;
SO.doRecruit = function(){
  if(SO.G.budget < SO.RECRUIT_COST) return false;
  SO.G.budget -= SO.RECRUIT_COST;
  var used = new Set(SO.G.staff.map(function(s){return s.username;}));
  var s = SO.genStaff(0, used);
  SO.G.staff.push(s);
  SO.G.stats.recruited++;
  SO.addLog('You recruited a new Junior Mod, '+s.username+'. ($'+SO.RECRUIT_COST+')','good');
  SO.toast('Recruited '+s.username+'.','good');
  return true;
};

/* ---------- Mentorship ---------- */
SO.assignMentor = function(mentorS, menteeS){
  if(mentorS.rank<2 || menteeS.rank>1) return false;
  if(mentorS.menteeId || menteeS.mentorId) return false;
  mentorS.menteeId = menteeS.id;
  menteeS.mentorId = mentorS.id;
  SO.addLog(mentorS.username+' is now mentoring '+menteeS.username+'.','good');
  return true;
};
SO.unassignMentor = function(s){
  if(s.mentorId){ var m=SO.byId(s.mentorId); if(m) m.menteeId=null; s.mentorId=null; }
  if(s.menteeId){ var m2=SO.byId(s.menteeId); if(m2) m2.mentorId=null; s.menteeId=null; }
};

/* ---------- Elections ---------- */
SO.triggerElection = function(rank){
  if(SO.G.elections.some(function(e){return e.rank===rank;})) return;
  var pool = SO.activeStaff().filter(function(s){return s.rank===rank-1;});
  pool.sort(function(a,b){ return (b.maturityHidden+b.loyalty) - (a.maturityHidden+a.loyalty); });
  var candidates = pool.slice(0,4).map(function(s){return s.id;});
  if(!candidates.length) return;
  SO.G.elections.push({id:'e'+SO.G.day+'_'+rank, rank:rank, candidates:candidates, deadlineDay:SO.G.day+5});
  SO.addLog('An election has opened for '+SO.RANKS[rank]+'.','info');
};
SO.resolveElection = function(electionId, winnerId){
  var el = SO.G.elections.find(function(e){return e.id===electionId;});
  if(!el) return;
  SO.G.elections = SO.G.elections.filter(function(e){return e.id!==electionId;});
  var s = SO.byId(winnerId);
  if(!s || s.status!=='active') return;
  SO.doPromote(s,{by:'Election'});
  SO.addLog(s.username+' won the election for '+SO.RANKS[el.rank]+'.','good');
};

/* ---------- Appeals ---------- */
SO.queueAppeal = function(s, actionType, restoreRank){
  SO.G.pendingAppealsCount = (SO.G.pendingAppealsCount||0)+1;
  s.pendingAppeal = {actionType:actionType, restoreRank:restoreRank, dueDay:SO.G.day+SO.randInt(2,4)};
};
SO.tickAppeals = function(){
  SO.activeStaff().forEach(function(s){
    if(s.pendingAppeal && SO.G.day>=s.pendingAppeal.dueDay){
      SO.G.appealQueue = SO.G.appealQueue || [];
      SO.G.appealQueue.push({staffId:s.id, appeal:s.pendingAppeal});
      s.pendingAppeal = null;
    }
  });
};
SO.resolveAppeal = function(staffId, uphold){
  var s = SO.byId(staffId);
  SO.G.appealQueue = (SO.G.appealQueue||[]).filter(function(a){return a.staffId!==staffId;});
  if(!s) return;
  if(uphold){
    s.drama = SO.clamp(s.drama+4,0,100);
    SO.addLog('You upheld the decision on '+s.username+". Some grumbling, but it stands.",'warn');
  } else {
    if(s.status==='active'){
      s.rank = SO.G.appealQueue_restoreRank_temp || s.rank;
    }
    s.loyalty = SO.clamp(s.loyalty+10,0,100);
    s.satisfaction = SO.clamp(s.satisfaction+8,0,100);
    SO.orgShock(1,1,-3);
    SO.G.stats.appealsOverturned++;
    SO.addLog('You overturned the decision on '+s.username+'. The team sees it as fair.','good');
  }
};

/* ---------- Tiffa ---------- */
SO.isRevealed = function(s, field){
  if(field==='basic') return true;
  if(field==='personality') return s.revealLevel>=1;
  if(field==='maturity'||field==='goal') return s.revealLevel>=2;
  if(field==='numbers') return s.revealLevel>=3;
  return false;
};
SO.isGolden = function(s){ return !!s.goldenStat && s[s.goldenStat]>=90 && !s.ascended; };
SO.isAscended = function(s){ return !!s.ascended; };

SO.meetsPromoteCriteria = function(s, crit){
  if(!crit) return false;
  var weeks = Math.floor(s.daysInRank/7);
  if(weeks < crit.minWeeks) return false;
  if(s.hoursPerWeek < crit.minHours) return false;
  if(crit.minMaturity>0){
    if(!SO.isRevealed(s,'maturity')) return false;
    if(s.maturityHidden < crit.minMaturity) return false;
  }
  return true;
};
SO.meetsDemoteCriteria = function(s, crit){
  if(!crit || !crit.enabled) return false;
  if(s.hoursPerWeek < crit.minHours) return true;
  if(SO.isRevealed(s,'numbers') && s.drama > crit.maxDrama) return true;
  return false;
};
SO.computeTiffaRecommendations = function(){
  var list = [];
  SO.activeStaff().forEach(function(s){
    if(s.queued) return;
    if(s.rank<5 && SO.meetsPromoteCriteria(s, SO.G.tiffa.promoteCriteria[s.rank])){
      list.push({staffId:s.id, type:'promote', fromRank:s.rank, toRank:s.rank+1, reason:'meets tenure, hours & maturity bar'});
    } else if(s.rank>0 && SO.meetsDemoteCriteria(s, SO.G.tiffa.demoteCriteria[s.rank])){
      list.push({staffId:s.id, type:'demote', fromRank:s.rank, toRank:s.rank-1, reason: s.hoursPerWeek < SO.G.tiffa.demoteCriteria[s.rank].minHours ? 'inactivity' : 'drama reports'});
    }
  });
  return list;
};
SO.runTiffa = function(){
  if(!SO.G.tiffa.autopilot || SO.hasDisruption('busyTiffa')) return;
  var recs = SO.computeTiffaRecommendations();
  recs.forEach(function(r){
    var s = SO.byId(r.staffId);
    if(!s || s.status!=='active') return;
    if(r.type==='promote'){
      SO.doPromote(s,{silent:true,by:'Tiffa'});
      SO.addLog('Tiffa promoted '+s.username+' to '+SO.RANKS[s.rank]+', '+r.reason+'.','good');
      SO.pushTiffaNotif('promoted '+s.username+' to '+SO.RANKS[s.rank]+', '+r.reason+'.');
    } else {
      SO.doDemote(s,{silent:true,by:'Tiffa'});
      SO.addLog('Tiffa demoted '+s.username+' to '+SO.RANKS[s.rank]+', '+r.reason+'.','warn');
      SO.pushTiffaNotif('demoted '+s.username+' to '+SO.RANKS[s.rank]+', '+r.reason+'.');
    }
    SO.G.stats.tiffaActions++;
  });
};
SO.tiffaInsightScan = function(){
  if(SO.hasDisruption('busyTiffa')) return;
  SO.activeStaff().forEach(function(s){
    if(SO.G.day - s.snapshotDay < 7) return;
    var dMat = s.maturityHidden - s.maturitySnapshot;
    var dDra = s.drama - s.dramaSnapshot;
    var dSat = s.satisfaction - s.satisfactionSnapshot;
    var msg = null;
    if(dDra>=14 && SO.isRevealed(s,'numbers')){
      msg = SO.RANKS[s.rank]+' '+s.username+' has gotten a lot more dramatic lately, might be worth a look.';
    } else if(dSat<=-14){
      msg = SO.RANKS[s.rank]+' '+s.username+' seems to be burning out, satisfaction is sliding fast.';
    } else if(dMat<=-7 && SO.isRevealed(s,'maturity')){
      msg = SO.RANKS[s.rank]+' '+s.username+' is getting less mature by the day.';
    } else if(dMat>=7 && SO.isRevealed(s,'maturity')){
      msg = SO.RANKS[s.rank]+' '+s.username+' has really grown lately, might be ready for more responsibility.';
    } else if(s.rank>=2 && s.hoursPerWeek<=2){
      msg = SO.RANKS[s.rank]+' '+s.username+" has barely been active lately, you might want to check in.";
    } else if(s.dreamRank!=null && !s.dreamAchieved && s.rank===s.dreamRank-1 && s.hoursPerWeek>=8 && Math.random()<0.5){
      msg = s.username+' is one promotion away from their dream of making '+SO.RANKS[s.dreamRank]+'.';
    }
    if(msg) SO.pushTiffaNotif(msg);
    s.maturitySnapshot = s.maturityHidden;
    s.dramaSnapshot = s.drama;
    s.satisfactionSnapshot = s.satisfaction;
    s.snapshotDay = SO.G.day;
  });
};

/* ---------- Draft news ---------- */
SO.toggleQueue = function(s, type){
  if(s.queued && s.queued.type===type){
    SO.G.draftNews = SO.G.draftNews.filter(function(d){return d.staffId!==s.id;});
    s.queued = null;
    return;
  }
  SO.G.draftNews = SO.G.draftNews.filter(function(d){return d.staffId!==s.id;});
  var entry = {staffId:s.id, type:type, fromRank:s.rank, toRank: type==='promote'?s.rank+1:s.rank-1};
  SO.G.draftNews.push(entry);
  s.queued = entry;
};
SO.applyNewsList = function(list){
  list.forEach(function(entry){
    var s = SO.byId(entry.staffId);
    if(!s || s.status!=='active') return;
    if(entry.type==='promote') SO.doPromote(s,{by:'Staff News'});
    else SO.doDemote(s,{by:'Staff News'});
  });
};
SO.closeDraftQueues = function(){
  SO.G.staff.forEach(function(s){s.queued=null;});
  SO.G.draftNews = [];
  SO.G.tiffa.pitch = [];
};
SO.finishMonday = function(msg, hadChanges){
  SO.addLog(msg,'info');
  SO.orgShock(hadChanges?1:0, 0, hadChanges?-6:-2);
  SO.G.awaitingNews = false;
  SO.recomputeMeters();
  SO.closeModal();
  SO.checkWinCondition();
  SO.renderAll();
  SO.advanceQueueOrMonday();
};
SO.sendDraft = function(){
  var n = SO.G.draftNews.length;
  SO.applyNewsList(SO.G.draftNews);
  SO.closeDraftQueues();
  SO.finishMonday('Staff News sent: '+n+' change(s) went live.', n>0);
};
SO.sendTiffaPitch = function(){
  var n = SO.G.tiffa.pitch.length;
  SO.applyNewsList(SO.G.tiffa.pitch);
  SO.closeDraftQueues();
  SO.finishMonday("Tiffa's Staff News pitch sent: "+n+' change(s) went live.', n>0);
};
SO.discardAll = function(){
  SO.closeDraftQueues();
  SO.finishMonday('No Staff News sent this week.', false);
};

/* ---------- Incident resolution ---------- */
SO.resolveIncident = function(incId, action){
  var inc = SO.G.pendingIncidents.find(function(i){return i.id===incId;});
  if(!inc) return;
  var s = SO.byId(inc.staffId);
  SO.G.pendingIncidents = SO.G.pendingIncidents.filter(function(i){return i.id!==incId;});
  if(s && action){
    if(action==='warn') SO.doWarn(s);
    else if(action==='restrict') SO.doRestrict(s);
    else if(action==='demote') SO.doDemote(s,{justified:true,by:'You'});
    else if(action==='ignore') SO.doIgnore(s);
    else if(action==='brushoff') SO.doBrushOff(s);
    else if(action==='commend') SO.doCommend(s);
  }
  if(inc.severity==='minor') SO.G.stats.minorHandled++;
  else if(inc.severity==='moderate') SO.G.stats.moderateHandled++;
  SO.recomputeMeters();
  SO.checkWinCondition();
  SO.renderAll();
};
SO.bulkResolveMinor = function(){
  var minors = SO.G.pendingIncidents.filter(function(i){return i.severity==='minor';});
  minors.forEach(function(inc){
    var s = SO.byId(inc.staffId);
    if(s) SO.doBrushOff(s);
  });
  SO.G.pendingIncidents = SO.G.pendingIncidents.filter(function(i){return i.severity!=='minor';});
  SO.G.stats.minorHandled += minors.length;
  SO.recomputeMeters();
  SO.renderAll();
  if(minors.length) SO.toast('Brushed off '+minors.length+' minor incident(s).','good');
};
SO.resolveMajorPopup = function(action){
  var inc = SO.G.majorPopupQueue.shift();
  if(!inc) return;
  var s = SO.byId(inc.staffId);
  if(s && action){
    if(action==='warn') SO.doWarn(s);
    else if(action==='restrict') SO.doRestrict(s);
    else if(action==='demote') SO.doDemote(s,{justified:true,by:'You'});
    else if(action==='ignore') SO.doIgnore(s);
  }
  SO.G.stats.majorHandled++;
  SO.recomputeMeters();
  SO.checkWinCondition();
  SO.renderAll();
  SO.advanceQueueOrMonday();
};
