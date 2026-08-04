
var SO = window.SO = window.SO || {};

SO.openModal = function(html, opts){
  opts = opts||{};
  SO.closeModal();
  var backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop'+(opts.blocking?' blocking':'');
  backdrop.innerHTML = '<div class="modal">'+html+'</div>';
  if(!opts.blocking){
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop) SO.closeModal(); });
  }
  SO.$('modalRoot').appendChild(backdrop);
  SO.$('modalRoot').style.pointerEvents = 'all';
};
SO.closeModal = function(){
  SO.$('modalRoot').innerHTML = '';
  SO.$('modalRoot').style.pointerEvents = 'none';
};

SO.maturityLabel = function(v){
  if(v>=80) return 'Highly Mature';
  if(v>=60) return 'Mature';
  if(v>=40) return 'Developing';
  return 'Immature';
};
SO.redactedBlock = function(){
  return '<div class="redacted"><span>&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;</span><span class="tag">CLASSIFIED</span></div>';
};
SO.barRow = function(label,val,color){
  return '<div class="row"><span class="l">'+label+'</span><div class="track"><div class="fill" style="width:'+val+'%;background:'+color+'"></div></div><span class="v">'+Math.round(val)+'</span></div>';
};

SO.openProfile = function(id){
  var s = SO.byId(id);
  if(!s) return;
  var specialColor = SO.isAscended(s) ? 'var(--purple-stat)' : (SO.isGolden(s) ? 'var(--gold-stat)' : null);
  var body = '';
  body += '<div class="section-title">Basics</div>';
  body += '<div class="field-row"><label>Role</label><span class="mono">'+SO.RANKS[s.rank]+(s.focus?' \u00b7 '+s.focus:'')+'</span></div>';
  body += '<div class="field-row"><label>Activity</label><span class="mono">'+s.hoursPerWeek+' hrs/week</span></div>';
  body += '<div class="field-row"><label>Time in role</label><span class="mono">'+Math.floor(s.daysInRank/7)+' week(s)</span></div>';
  body += '<div class="field-row"><label>Commendations</label><span class="mono">'+s.commendations+'</span></div>';
  if(s.restrictedUntil>=SO.G.day) body += '<div class="field-row"><label>Status</label><span class="mono" style="color:var(--amber)">Restricted until day '+s.restrictedUntil+'</span></div>';
  if(s.mentorId){ var mtr=SO.byId(s.mentorId); body += '<div class="field-row"><label>Mentor</label><span class="mono">'+(mtr?mtr.username:'\u2014')+'</span></div>'; }
  if(s.menteeId){ var mte=SO.byId(s.menteeId); body += '<div class="field-row"><label>Mentee</label><span class="mono">'+(mte?mte.username:'\u2014')+'</span></div>'; }

  body += '<div class="section-title">Personality</div>';
  if(SO.isRevealed(s,'personality')){
    body += '<div class="profile-tags">'+s.traits.map(function(t){return '<span class="pill">'+t+'</span>';}).join('')+
      (s.revealLevel===1?' <span class="stamp-reveal">REVEALED</span>':'')+'</div>';
  } else { body += SO.redactedBlock(); }

  body += '<div class="section-title">Maturity &amp; Goals</div>';
  if(SO.isRevealed(s,'maturity')){
    body += '<div class="field-row"><label>Maturity</label><span class="mono">'+SO.maturityLabel(s.maturityHidden)+' ('+Math.round(s.maturityHidden)+')</span></div>';
    body += '<div class="field-row"><label>Stated goal</label><span style="text-align:right;flex:1">'+s.goal+'</span></div>';
  } else { body += SO.redactedBlock(); }

  body += '<div class="section-title">True Colors'+
    (SO.isAscended(s)?' <span class="pill ascended">ASCENDED</span>':SO.isGolden(s)?' <span class="pill golden">DREAM FULFILLED</span>':'')+
    '</div>';
  if(SO.isRevealed(s,'numbers')){
    var loyColor = (s.goldenStat==='loyalty' && specialColor) ? specialColor : 'var(--teal)';
    var satColor = (s.goldenStat==='satisfaction' && specialColor) ? specialColor : 'var(--amber)';
    body += '<div class="bar3">'+
      SO.barRow('Loyalty', s.loyalty, loyColor)+
      SO.barRow('Satisfaction', s.satisfaction, satColor)+
      SO.barRow('Drama', s.drama, 'var(--crimson)')+
      '</div>';
  } else { body += SO.redactedBlock(); }

  if(s.bio) body += '<div class="section-title">Notes</div><div style="color:var(--text-dim);font-size:12.5px">'+s.bio+'</div>';

  var incs = SO.G.pendingIncidents.filter(function(i){return i.staffId===s.id;});
  if(incs.length){
    body += '<div class="section-title">Open Reports</div>';
    incs.forEach(function(i){body += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:4px;">[Day '+i.day+', '+i.severity+'] '+i.desc+'</div>';});
  }

  var canPromote = s.rank<5;
  var canDemote = s.rank>0;
  var emergencyOk = !SO.isMonday() && !SO.G.awaitingNews && !SO.G.majorPopupQueue.length;
  var praiseOk = s.lastPraiseDay!==SO.G.day;
  var timeOffOk = (SO.G.day - s.lastTimeOffDay) >= 7;
  var canMentor = s.rank>=2 && !s.menteeId;
  var canBeMentored = s.rank<=1 && !s.mentorId;

  var foot = '';
  foot += '<button class="btn" data-act-staff="investigate" data-id="'+s.id+'" '+(SO.G.investigateLeft<=0?'disabled title="No investigations left today"':'')+'>Investigate ('+SO.G.investigateLeft+' left today)</button>';
  foot += '<button class="btn bgood" data-act-staff="praise" data-id="'+s.id+'" '+(praiseOk?'':'disabled title="Already praised today"')+'>Praise</button>';
  foot += '<button class="btn bgood" data-act-staff="timeoff" data-id="'+s.id+'" '+(timeOffOk?'':'disabled title="On cooldown"')+'>Give Time Off</button>';
  foot += '<button class="btn bgood" data-act-staff="bonus" data-id="'+s.id+'" '+(SO.G.budget>=SO.BONUS_COST?'':'disabled title="Not enough budget"')+'>Bonus Pay ($'+SO.BONUS_COST+')</button>';
  if(canMentor) foot += '<button class="btn" data-act-staff="pickmentee" data-id="'+s.id+'">Assign as Mentor</button>';
  if(s.mentorId || s.menteeId) foot += '<button class="btn" data-act-staff="unmentor" data-id="'+s.id+'">End Mentorship</button>';
  if(canPromote) foot += '<button class="btn" data-act-staff="queuepromote" data-id="'+s.id+'">'+(s.queued&&s.queued.type==='promote'?'Cancel Queued Promotion':'Queue Promotion')+'</button>';
  if(canDemote) foot += '<button class="btn" data-act-staff="queuedemote" data-id="'+s.id+'">'+(s.queued&&s.queued.type==='demote'?'Cancel Queued Demotion':'Queue Demotion')+'</button>';
  if(canPromote) foot += '<button class="btn bgood" data-act-staff="epromote" data-id="'+s.id+'" '+(emergencyOk?'':'disabled title="Only available Tue-Sun"')+'>Emergency Promote</button>';
  if(canDemote) foot += '<button class="btn bdanger" data-act-staff="edemote" data-id="'+s.id+'" '+(emergencyOk?'':'disabled title="Only available Tue-Sun"')+'>Emergency Demote</button>';
  foot += '<button class="btn bwarn" data-act-staff="warn" data-id="'+s.id+'">Warn</button>';
  foot += '<button class="btn bwarn" data-act-staff="restrict" data-id="'+s.id+'">Restrict</button>';
  foot += '<button class="btn bdanger" data-act-staff="terminate" data-id="'+s.id+'">Terminate</button>';

  SO.openModal(
    '<div class="modal-head"><h3>'+s.username+' &mdash; PERSONNEL FILE</h3><button class="modal-close" data-close>&#10005;</button></div>'+
    '<div class="modal-body">'+body+'</div>'+
    '<div class="modal-foot">'+foot+'</div>'
  );
};

SO.openMentorPicker = function(mentorId){
  var mentor = SO.byId(mentorId);
  if(!mentor) return;
  var candidates = SO.activeStaff().filter(function(s){return s.rank<=1 && !s.mentorId && s.id!==mentor.id;});
  var html = '<div id="mpList">';
  if(!candidates.length) html += '<div class="empty-note">No unmentored Junior Mods or Mods available.</div>';
  candidates.forEach(function(s){
    html += '<div class="staffpick" data-mentee="'+s.id+'" data-mentor="'+mentor.id+'">'+SO.rankIcon(s.rank)+
      '<span class="mono">'+s.username+'</span><span style="color:var(--text-dim);font-size:11px;margin-left:auto">'+SO.RANKS[s.rank]+'</span></div>';
  });
  html += '</div>';
  SO.openModal(
    '<div class="modal-head"><h3>ASSIGN MENTEE FOR '+mentor.username+'</h3><button class="modal-close" data-close>&#10005;</button></div>'+
    '<div class="modal-body">'+html+'</div>'
  );
};

SO.openEmergencyPicker = function(type){
  var canAct = function(s){return type==='promote' ? s.rank<5 : s.rank>0;};
  var list = SO.activeStaff().filter(canAct).sort(function(a,b){
    if(b.rank!==a.rank) return b.rank-a.rank;
    return a.username.localeCompare(b.username);
  });
  var html = '<input type="text" id="empSearch" placeholder="Search staff..." style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--line2);background:var(--bg-deep);color:var(--text);margin-bottom:10px;">';
  html += '<div id="empList">';
  if(!list.length) html += '<div class="empty-note">No eligible staff.</div>';
  list.forEach(function(s){
    html += '<div class="staffpick" data-emp="'+s.id+'" data-type="'+type+'">'+SO.rankIcon(s.rank)+
      '<span class="mono">'+s.username+'</span><span style="color:var(--text-dim);font-size:11.5px;margin-left:auto">'+SO.RANKS[s.rank]+' &rarr; '+SO.RANKS[type==='promote'?s.rank+1:s.rank-1]+'</span></div>';
  });
  html += '</div>';
  SO.openModal(
    '<div class="modal-head"><h3>EMERGENCY '+(type==='promote'?'PROMOTE':'DEMOTE')+'</h3><button class="modal-close" data-close>&#10005;</button></div>'+
    '<div class="modal-body">'+html+'</div>'
  );
  var searchEl = SO.$('empSearch');
  if(searchEl) searchEl.addEventListener('input', function(e){
    var q = e.target.value.toLowerCase();
    document.querySelectorAll('#empList .staffpick').forEach(function(row){
      var name = row.querySelector('.mono').textContent.toLowerCase();
      row.style.display = name.indexOf(q)>=0 ? '' : 'none';
    });
  });
};

SO.confirmEmergency = function(id, type){
  var s = SO.byId(id);
  if(!s) return;
  var verb = type==='promote'?'promote':'demote';
  var toRank = type==='promote'?s.rank+1:s.rank-1;
  SO.openModal(
    '<div class="modal-head"><h3>CONFIRM</h3></div>'+
    '<div class="modal-body">Emergency '+verb+' <strong>'+s.username+'</strong> from '+SO.RANKS[s.rank]+' to '+SO.RANKS[toRank]+' right now? This bypasses the normal Staff News process and stirs up some drama.</div>'+
    '<div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn '+(type==='promote'?'bgood':'bdanger')+'" id="confirmEmpBtn">Confirm</button></div>'
  );
  SO.$('confirmEmpBtn').addEventListener('click', function(){
    if(type==='promote') SO.doPromote(s,{emergency:true,by:'an emergency order'});
    else SO.doDemote(s,{emergency:true,by:'an emergency order'});
    SO.recomputeMeters();
    SO.checkWinCondition();
    SO.closeModal();
    SO.renderAll();
  });
};

SO.confirmTerminate = function(id, opts){
  opts = opts || {context:'profile'};
  var s = SO.byId(id);
  if(!s) return;
  SO.openModal(
    '<div class="modal-head"><h3>CONFIRM TERMINATION</h3></div>'+
    '<div class="modal-body">Remove <strong>'+s.username+'</strong> from the staff team entirely? This can\'t be undone.'+
      (s.rank===5?'<div style="margin-top:8px;color:var(--amber);font-size:12px;">They are your Head Admin. Losing them without a replacement will trigger an election.</div>':'')+
    '</div>'+
    '<div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn bdanger" id="confirmTermBtn">Terminate</button></div>'
  );
  SO.$('confirmTermBtn').addEventListener('click', function(){
    var justified = (opts.context==='majorpopup') || (s.drama>=65);
    SO.doTerminate(s,{justified:justified});
    if(opts.context==='incident' && opts.incId){
      SO.G.pendingIncidents = SO.G.pendingIncidents.filter(function(i){return i.id!==opts.incId;});
      SO.G.stats.moderateHandled++;
    }
    SO.recomputeMeters();
    SO.checkWinCondition();
    if(opts.context==='majorpopup'){
      SO.G.majorPopupQueue.shift();
      SO.G.stats.majorHandled++;
      SO.renderAll();
      SO.advanceQueueOrMonday();
    } else {
      SO.closeModal();
      SO.renderAll();
    }
  });
};

SO.openMajorIncidentModal = function(){
  var inc = SO.G.majorPopupQueue[0];
  if(!inc){ SO.advanceQueueOrMonday(); return; }
  var s = SO.byId(inc.staffId);
  if(!s){ SO.G.majorPopupQueue.shift(); SO.advanceQueueOrMonday(); return; }
  var foot = '<button class="btn bwarn" data-majoract="warn">Warn</button>'+
    '<button class="btn bwarn" data-majoract="restrict">Restrict</button>'+
    (s.rank>0?'<button class="btn bdanger" data-majoract="demote">Demote</button>':'')+
    '<button class="btn bdanger" data-majoract="terminate">Terminate</button>'+
    '<button class="btn" data-majoract="ignore">Ignore</button>';
  SO.openModal(
    '<div class="modal-head"><h3 style="color:var(--sev-major)">MAJOR INCIDENT</h3></div>'+
    '<div class="modal-body"><div class="incident-desc" style="font-size:14px;">'+inc.desc+'</div>'+
    '<div style="margin-top:10px;font-size:12px;color:var(--text-dim)">'+s.username+', '+SO.RANKS[s.rank]+(SO.G.majorPopupQueue.length>1?' &mdash; '+(SO.G.majorPopupQueue.length-1)+' more waiting':'')+'</div></div>'+
    '<div class="modal-foot">'+foot+'</div>',
    {blocking:true}
  );
};

SO.openElectionModal = function(electionId){
  var el = SO.G.elections.find(function(e){return e.id===electionId;});
  if(!el){ SO.advanceQueueOrMonday(); return; }
  var html = '<div class="election-card"><div class="section-title" style="margin-top:0;">Vacant: '+SO.RANKS[el.rank]+'</div>';
  el.candidates.forEach(function(cid){
    var c = SO.byId(cid);
    if(!c || c.status!=='active') return;
    html += '<div class="candidate-row"><span class="mono">'+c.username+'</span><span style="color:var(--text-dim);font-size:11px;">'+SO.RANKS[c.rank]+'</span>'+
      '<button class="btn bgood" data-elect="'+el.id+'" data-winner="'+c.id+'" data-blocking="1">Elect</button></div>';
  });
  html += '</div>';
  SO.openModal(
    '<div class="modal-head"><h3>ELECTION: '+SO.RANKS[el.rank]+'</h3></div>'+
    '<div class="modal-body">'+html+'</div>',
    {blocking:true}
  );
};

SO.openAppealModal = function(){
  var q = SO.G.appealQueue||[];
  if(!q.length){ SO.advanceQueueOrMonday(); return; }
  var item = q[0];
  var s = SO.byId(item.staffId);
  if(!s){ SO.G.appealQueue.shift(); SO.advanceQueueOrMonday(); return; }
  SO.G.appealQueue_restoreRank_temp = item.appeal.restoreRank;
  SO.openModal(
    '<div class="modal-head"><h3>APPEAL FILED</h3></div>'+
    '<div class="modal-body">A group of staff are appealing the recent '+item.appeal.actionType+' of <strong>'+s.username+'</strong>, arguing it was based on thin evidence. Uphold it, or overturn it and restore them?</div>'+
    '<div class="modal-foot"><button class="btn bwarn" id="upholdBtn">Uphold</button><button class="btn bgood" id="overturnBtn">Overturn</button></div>',
    {blocking:true}
  );
  SO.$('upholdBtn').addEventListener('click', function(){ SO.resolveAppeal(s.id,true); SO.G.appealQueue.shift(); SO.renderAll(); SO.advanceQueueOrMonday(); });
  SO.$('overturnBtn').addEventListener('click', function(){ SO.resolveAppeal(s.id,false); SO.G.appealQueue.shift(); SO.renderAll(); SO.advanceQueueOrMonday(); });
};

SO.openMondayModal = function(){
  var yourList = SO.G.draftNews;
  var pitch = SO.G.tiffa.pitch;
  var html = '<div class="section-title">Is this the Staff News you want to send?</div>';
  html += '<div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">Once sent, this is final until next Monday, unless you use an Emergency action.</div>';
  html += '<div class="section-title">Your Draft ('+yourList.length+')</div>';
  if(!yourList.length){
    html += '<div class="empty-note">You didn\'t queue anything this week.</div>';
  } else {
    yourList.forEach(function(d){
      var s = SO.byId(d.staffId);
      if(!s) return;
      html += '<div class="draftrow"><span class="mono">'+s.username+'</span><span class="arrow">'+SO.RANKS[d.fromRank]+' &rarr; '+SO.RANKS[d.toRank]+'</span></div>';
    });
  }
  html += '<div class="section-title">Tiffa\'s Pitch ('+pitch.length+')</div>';
  if(SO.G.tiffa.autopilot){
    html += '<div class="empty-note">Tiffa is on autopilot, she already actioned matching staff live this week. Check her Notifications for what she did.</div>';
  } else if(SO.hasDisruption('busyTiffa')){
    html += '<div class="empty-note">Tiffa is swamped this week (Busy Tiffa) and has no pitch for you.</div>';
  } else if(!pitch.length){
    html += '<div class="empty-note">Tiffa has no recommendations this week.</div>';
  } else {
    pitch.forEach(function(d){
      var s = SO.byId(d.staffId);
      if(!s) return;
      html += '<div class="draftrow"><span class="mono">'+s.username+'</span><span class="arrow">'+SO.RANKS[d.fromRank]+' &rarr; '+SO.RANKS[d.toRank]+'</span><span style="color:var(--text-dim);font-size:11px;margin-left:auto">'+d.reason+'</span></div>';
    });
  }
  SO.openModal(
    '<div class="modal-head"><h3>STAFF NEWS, DAY '+SO.G.day+' MONDAY</h3></div>'+
    '<div class="modal-body">'+html+'</div>'+
    '<div class="modal-foot">'+
      '<button class="btn" id="discardBtn">Discard, send nothing</button>'+
      (pitch.length?'<button class="btn bgood" id="sendPitchBtn">Send Tiffa\'s Pitch</button>':'')+
      '<button class="btn bgood" id="sendDraftBtn">Send My Draft</button>'+
    '</div>',
    {blocking:true}
  );
  SO.$('discardBtn').addEventListener('click', SO.discardAll);
  SO.$('sendDraftBtn').addEventListener('click', SO.sendDraft);
  if(pitch.length) SO.$('sendPitchBtn').addEventListener('click', SO.sendTiffaPitch);
};

SO.openTiffaModal = function(){
  var pc = SO.G.tiffa.promoteCriteria, dc = SO.G.tiffa.demoteCriteria;
  function promoRow(rank){
    var c = pc[rank];
    return '<div class="tiffa-card"><div class="tiffa-card-title">'+SO.RANKS[rank]+' &rarr; '+SO.RANKS[rank+1]+'</div>'+
      '<div class="tiffa-grid">'+
        '<div class="tiffa-field"><label>Min. weeks in role</label><input type="number" min="0" value="'+c.minWeeks+'" data-pc="'+rank+'" data-f="minWeeks"></div>'+
        '<div class="tiffa-field"><label>Min. hours/week</label><input type="number" min="0" value="'+c.minHours+'" data-pc="'+rank+'" data-f="minHours"></div>'+
        '<div class="tiffa-field"><label>Min. maturity (0 = skip check)</label><input type="number" min="0" max="100" value="'+c.minMaturity+'" data-pc="'+rank+'" data-f="minMaturity"></div>'+
      '</div></div>';
  }
  function demoRow(rank){
    var c = dc[rank];
    return '<div class="tiffa-card"><div class="tiffa-card-title">Auto-demote from '+SO.RANKS[rank]+'</div>'+
      '<div class="tiffa-field" style="flex-direction:row;align-items:center;gap:8px;margin-bottom:12px;"><input type="checkbox" '+(c.enabled?'checked':'')+' data-dc="'+rank+'" data-f="enabled" style="width:auto;"><label style="margin:0;">Enabled</label></div>'+
      '<div class="tiffa-grid">'+
        '<div class="tiffa-field"><label>Min. hours/week (below this, demote)</label><input type="number" min="0" value="'+c.minHours+'" data-dc="'+rank+'" data-f="minHours"></div>'+
        '<div class="tiffa-field"><label>Max. drama (above this, demote)</label><input type="number" min="0" max="100" value="'+c.maxDrama+'" data-dc="'+rank+'" data-f="maxDrama"></div>'+
      '</div></div>';
  }
  var body = '<div class="tab-row">'+
    '<button class="tabbtn active" data-tiffatab="settings">Settings</button>'+
    '<button class="tabbtn" data-tiffatab="log">Her Recent Actions</button>'+
    '</div>';
  if(SO.hasDisruption('busyTiffa')){
    body += '<div style="border:1px solid var(--sev-moderate);background:rgba(194,84,27,0.12);padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:12.5px;">Tiffa is currently swamped (Busy Tiffa) and won\'t pitch Staff News or act automatically until it resolves.</div>';
  }
  body += '<div id="tiffaSettings">';
  body += '<div class="field-row"><label><strong>Autopilot</strong>, act instantly instead of only pitching Mondays</label><input type="checkbox" id="tiffaAutoChk" '+(SO.G.tiffa.autopilot?'checked':'')+'></div>';
  body += '<div class="section-title" style="margin-top:18px;">PROMOTION CRITERIA</div>';
  body += '<div class="tiffa-note">Promotes someone only when EVERY condition below is met, using only what you\'ve already learned about them.</div>';
  for(var r=0;r<5;r++) body += promoRow(r);
  body += '<div class="section-title" style="margin-top:18px;">DEMOTION CRITERIA</div>';
  body += '<div class="tiffa-note">Demotes someone if ANY one condition below is true.</div>';
  for(var r2=1;r2<6;r2++) body += demoRow(r2);
  body += '</div>';
  body += '<div id="tiffaLog" class="hidden">';
  var actions = SO.G.tiffa.notifications.slice(0,40);
  body += actions.length ? actions.map(function(n){return '<div class="logrow"><span class="d">Day '+n.day+'</span>'+n.text+'</div>';}).join('') : '<div class="empty-note">No actions yet.</div>';
  body += '</div>';

  SO.openModal(
    '<div class="modal-head"><h3>TIFFA, DIRECTOR OF STAFF</h3><button class="modal-close" data-close>&#10005;</button></div>'+
    '<div class="modal-body">'+body+'</div>'+
    '<div class="modal-foot"><button class="btn bgood" id="saveTiffaBtn">Save Settings</button></div>'
  );

  document.querySelectorAll('[data-tiffatab]').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('[data-tiffatab]').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      var tab = b.getAttribute('data-tiffatab');
      SO.$('tiffaSettings').classList.toggle('hidden', tab!=='settings');
      SO.$('tiffaLog').classList.toggle('hidden', tab!=='log');
    });
  });
  SO.$('saveTiffaBtn').addEventListener('click', function(){
    SO.G.tiffa.autopilot = SO.$('tiffaAutoChk').checked;
    document.querySelectorAll('[data-pc]').forEach(function(inp){
      var rank = +inp.getAttribute('data-pc'); var f = inp.getAttribute('data-f');
      pc[rank][f] = Math.max(0, parseInt(inp.value,10)||0);
    });
    document.querySelectorAll('[data-dc]').forEach(function(inp){
      var rank = +inp.getAttribute('data-dc'); var f = inp.getAttribute('data-f');
      if(f==='enabled') dc[rank][f] = inp.checked; else dc[rank][f] = Math.max(0, parseInt(inp.value,10)||0);
    });
    SO.toast("Tiffa's criteria updated.",'good');
    SO.closeModal();
  });
};

SO.openTiffaNotifDrawer = function(){
  SO.G.tiffa.unread = 0;
  var list = SO.G.tiffa.notifications;
  var html = list.length ? list.map(function(n){return '<div class="logrow"><span class="d">Day '+n.day+'</span>'+n.text+'</div>';}).join('') : '<div class="empty-note">No notifications yet.</div>';
  SO.openModal('<div class="modal-head"><h3>TIFFA\'S NOTIFICATIONS</h3><button class="modal-close" data-close>&#10005;</button></div><div class="modal-body">'+html+'</div>');
  SO.renderAll();
};

SO.openHelpModal = function(){
  SO.openModal(
    '<div class="modal-head"><h3>HOW TO PLAY</h3><button class="modal-close" data-close>&#10005;</button></div>'+
    '<div class="modal-body">'+
    '<div class="section-title">The Loop</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Click <strong>End Day</strong> to advance time. Minor, moderate, and commendation reports land quietly in Incidents. Major incidents interrupt you immediately. Open any staff card to Investigate, Praise, give Time Off or a Bonus, assign a Mentor, or take disciplinary action.</p>'+
    '<div class="section-title">Budget</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Your population generates budget over time. Spend it on Appreciation Events, Bonus Pay, and Recruiting new Junior Mods. Watch out for Budget Crunch disruptions.</p>'+
    '<div class="section-title">Staff News</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Promotions/demotions queued Tuesday-Sunday bundle into a draft. Every Monday you send your draft, Tiffa\'s pitch, or nothing. Roles lock until next Monday unless you use an Emergency action.</p>'+
    '<div class="section-title">Elections &amp; Appeals</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">A vacant Supervisor or Head Admin seat triggers an election among top candidates instead of sitting empty. Punishing someone on thin evidence can trigger an appeal days later, letting the team push back.</p>'+
    '<div class="section-title">Mentorship</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Pair a Senior Mod+ with a Junior Mod or Mod. Mentees gain maturity faster and have fewer incidents; mentors get a small morale bump.</p>'+
    '<div class="section-title">Hidden Information</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Personality, goals, maturity and true feelings are hidden at first and reveal gradually. Tiffa\'s auto-actions only use what\'s already been revealed, just like you.</p>'+
    '<div class="section-title">The Goal</div>'+
    '<p style="color:var(--text-dim);font-size:13px;">Get Loyalty and Satisfaction near maximum and Drama near zero across the whole team, and you\'ll be offered a promotion of your own.</p>'+
    '</div>'
  );
};

SO.openEndingModal = function(){
  var st = SO.G.stats;
  var legendLines = SO.LEGENDARIES.map(function(leg){
    var s = SO.G.staff.find(function(x){return x.legendary===leg.name;});
    if(!s) return null;
    var status = s.status==='active' ? ('still on staff as '+SO.RANKS[s.rank]) : (s.status==='terminated'?'terminated':'quit');
    return leg.name+': '+status;
  }).filter(Boolean);

  var body = '<p style="color:var(--text-dim);font-size:13px;">Headquarters has noticed how well-run this server is. They want to hand you a bigger network to run.</p>';
  body += '<div class="section-title">Your Tenure</div>';
  body += '<div class="field-row"><label>Days managed</label><span class="mono">'+SO.G.day+'</span></div>';
  body += '<div class="field-row"><label>Promotions made</label><span class="mono">'+st.promotions+'</span></div>';
  body += '<div class="field-row"><label>Demotions made</label><span class="mono">'+st.demotions+'</span></div>';
  body += '<div class="field-row"><label>Terminations</label><span class="mono">'+st.terminations+'</span></div>';
  body += '<div class="field-row"><label>Warnings issued</label><span class="mono">'+st.warnings+'</span></div>';
  body += '<div class="field-row"><label>Restrictions issued</label><span class="mono">'+st.restrictions+'</span></div>';
  body += '<div class="field-row"><label>Incidents ignored</label><span class="mono">'+st.ignored+'</span></div>';
  body += '<div class="field-row"><label>Commendations given</label><span class="mono">'+st.commendationsGiven+'</span></div>';
  body += '<div class="field-row"><label>Appeals overturned</label><span class="mono">'+st.appealsOverturned+'</span></div>';
  body += '<div class="field-row"><label>Staff recruited</label><span class="mono">'+st.recruited+'</span></div>';
  body += '<div class="field-row"><label>Staff who quit</label><span class="mono">'+st.quits+'</span></div>';
  body += '<div class="field-row"><label>Tiffa\'s autonomous actions</label><span class="mono">'+st.tiffaActions+'</span></div>';
  body += '<div class="field-row"><label>Final server population</label><span class="mono">'+SO.G.serverPopulation+'</span></div>';
  if(legendLines.length){
    body += '<div class="section-title">Legendary Staff</div>';
    legendLines.forEach(function(l){ body += '<div style="font-size:12.5px;color:var(--text-dim);margin-bottom:3px;">'+l+'</div>'; });
  }
  body += '<div class="section-title">Final Numbers</div>';
  body += '<div class="field-row"><label>Loyalty</label><span class="mono">'+SO.G.meters.loyalty+'</span></div>';
  body += '<div class="field-row"><label>Satisfaction</label><span class="mono">'+SO.G.meters.satisfaction+'</span></div>';
  body += '<div class="field-row"><label>Drama</label><span class="mono">'+SO.G.meters.drama+'</span></div>';

  SO.openModal(
    '<div class="modal-head"><h3>PROMOTION OFFERED</h3></div>'+
    '<div class="modal-body">'+body+'</div>'+
    '<div class="modal-foot">'+
      '<button class="btn" id="declineEndBtn">Decline, keep managing this server</button>'+
      '<button class="btn bgood" id="acceptEndBtn">Accept &amp; start anew</button>'+
    '</div>',
    {blocking:true}
  );
  SO.$('declineEndBtn').addEventListener('click', function(){
    SO.addLog('You turned down the promotion to keep running things here.','good');
    SO.closeModal();
  });
  SO.$('acceptEndBtn').addEventListener('click', function(){
    SO.closeModal();
    SO.showIntro();
  });
};
