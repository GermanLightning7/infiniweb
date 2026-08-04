
var SO = window.SO = window.SO || {};
SO.$ = function(id){return document.getElementById(id);};
SO.rosterState = {search:'', rankFilter:'all', sort:'rank'};

SO.rankIcon = function(rank){return '<span class="dot" style="background:'+SO.RANK_COLOR[rank]+'"></span>';};

SO.renderAll = function(){
  if(!SO.G) return;
  var $ = SO.$;
  $('serverNameLbl').textContent = SO.G.serverName.toUpperCase();
  $('dayLbl').textContent = 'Day '+SO.G.day+' \u00b7 '+SO.weekdayName(SO.G.day);
  $('m-loy').style.width = SO.G.meters.loyalty+'%';
  $('m-sat').style.width = SO.G.meters.satisfaction+'%';
  $('m-dra').style.width = SO.G.meters.drama+'%';
  $('m-loy-v').textContent = SO.G.meters.loyalty;
  $('m-sat-v').textContent = SO.G.meters.satisfaction;
  $('m-dra-v').textContent = SO.G.meters.drama;

  var cap = SO.computeCapacity();
  var ratio = cap>0 ? SO.G.serverPopulation/cap : 0;
  var popColor = ratio<=0.95 ? 'var(--teal)' : (ratio<=1.1 ? 'var(--amber)' : 'var(--crimson)');
  $('m-pop').style.width = Math.min(100,ratio*100)+'%';
  $('m-pop').style.background = popColor;
  $('m-pop-v').textContent = SO.G.serverPopulation+' / '+cap;

  $('m-bud').style.width = Math.min(100, SO.G.budget/10)+'%';
  $('m-bud-v').textContent = '$'+SO.G.budget;

  var blocked = SO.G.awaitingNews || SO.G.majorPopupQueue.length>0 || SO.G.elections.length>0;
  $('endDayBtn').disabled = blocked;
  var emergencyOk = !SO.isMonday() && !blocked;
  $('btn-epromote').disabled = !emergencyOk;
  $('btn-edemote').disabled = !emergencyOk;
  $('eventBtn').disabled = SO.G.day < SO.G.eventCooldownUntil || SO.G.budget < SO.EVENT_COST;
  $('eventBtn').textContent = SO.G.day < SO.G.eventCooldownUntil ? ('Event (ready day '+SO.G.eventCooldownUntil+')') : ('Appreciation Event ($'+SO.EVENT_COST+')');
  $('recruitBtn').disabled = SO.G.budget < SO.RECRUIT_COST;
  $('recruitBtn').textContent = 'Recruit ($'+SO.RECRUIT_COST+')';

  var n = SO.G.tiffa.unread||0;
  var badge = $('tiffaNotifBadge');
  if(n>0){ badge.style.display='inline-block'; badge.textContent = n; } else { badge.style.display='none'; }

  $('cnt-roster').textContent = SO.activeStaff().length;
  $('cnt-incidents').textContent = SO.G.pendingIncidents.length;
  $('cnt-draft').textContent = SO.G.draftNews.length;
  $('cnt-elections').textContent = SO.G.elections.length || '';

  SO.renderRosterInfo();
  SO.renderRoster();
  SO.renderIncidents();
  SO.renderDraft();
  SO.renderElections();
  SO.renderLog();
};

SO.renderRosterInfo = function(){
  var cap = SO.computeCapacity();
  var ratio = cap>0 ? (SO.G.serverPopulation/cap) : 0;
  var reqSup = SO.requiredSupervisors();
  var curSup = SO.currentSupervisors();
  var supOk = curSup>=reqSup;
  var html = '<div class="pop-strip">';
  html += '<span>Population <strong class="mono">'+SO.G.serverPopulation+'</strong> / Capacity <strong class="mono">'+cap+'</strong> ('+Math.round(ratio*100)+'%)</span>';
  html += '<span style="color:'+(supOk?'var(--teal)':'var(--sev-major)')+'">Supervisors <strong class="mono">'+curSup+'/'+reqSup+'</strong>'+(supOk?' \u2014 adequate':' \u2014 understaffed!')+'</span>';
  html += '<span>Budget <strong class="mono">$'+SO.G.budget+'</strong></span>';
  html += '</div>';
  if(SO.G.disruptions.length){
    html += '<div class="disruption-wrap">';
    SO.G.disruptions.forEach(function(d){
      var remain = d.endDay!=null ? (d.endDay-SO.G.day) : null;
      html += '<div class="disruption-banner"><strong>'+d.label+'</strong> &mdash; '+d.desc+
        (remain!=null ? ' <span class="mono" style="color:var(--text-dim)">('+Math.max(0,remain)+'d left)</span>' : ' <span class="mono" style="color:var(--text-dim)">(ongoing)</span>')+
        '</div>';
    });
    html += '</div>';
  }
  SO.$('rosterInfo').innerHTML = html;
};

SO.renderRoster = function(){
  var rf = SO.$('rosterRankFilter');
  if(rf.options.length<=1){
    SO.RANKS.forEach(function(r,i){
      var o = document.createElement('option'); o.value=i; o.textContent=r; rf.appendChild(o);
    });
  }
  var list = SO.activeStaff().slice();
  var q = SO.rosterState.search.toLowerCase();
  if(q) list = list.filter(function(s){
    return s.username.toLowerCase().indexOf(q)>=0 || s.traits.some(function(t){return t.toLowerCase().indexOf(q)>=0;});
  });
  if(SO.rosterState.rankFilter!=='all') list = list.filter(function(s){return s.rank===+SO.rosterState.rankFilter;});
  if(SO.rosterState.sort==='name') list.sort(function(a,b){return a.username.localeCompare(b.username);});
  else if(SO.rosterState.sort==='hours') list.sort(function(a,b){return b.hoursPerWeek-a.hoursPerWeek;});
  else if(SO.rosterState.sort==='tenure') list.sort(function(a,b){return b.daysInRank-a.daysInRank;});
  else list.sort(function(a,b){ return b.rank-a.rank || a.username.localeCompare(b.username); });

  var html = '';
  list.forEach(function(s){
    var flags = '';
    if(s.legendary) flags += '<span class="pill leg">LEGENDARY</span>';
    if(SO.isAscended(s)) flags += '<span class="pill ascended">ASCENDED</span>';
    else if(SO.isGolden(s)) flags += '<span class="pill golden">DREAM FULFILLED</span>';
    if(s.restrictedUntil>=SO.G.day) flags += '<span class="pill">RESTRICTED</span>';
    if(s.queued) flags += '<span class="pill">QUEUED '+(s.queued.type==='promote'?'UP':'DOWN')+'</span>';
    if(s.riskyPromotion) flags += '<span class="pill">IN OVER THEIR HEAD</span>';
    if(s.mentorId) flags += '<span class="pill mentor">MENTORED</span>';
    if(s.menteeId) flags += '<span class="pill mentor">MENTORING</span>';
    html += '<div class="staffcard" data-open="'+s.id+'">'+
      '<div class="top">'+SO.rankIcon(s.rank)+'<span class="uname">'+s.username+'</span></div>'+
      '<div class="rank">'+SO.RANKS[s.rank]+(s.focus?' \u00b7 '+s.focus:'')+'</div>'+
      '<div class="hrs">'+s.hoursPerWeek+'h/wk \u00b7 '+Math.floor(s.daysInRank/7)+'wk in role</div>'+
      '<div class="tags">'+flags+'</div>'+
      '</div>';
  });
  SO.$('rosterList').innerHTML = html || '<div class="empty-note">No staff match your filters.</div>';
};

SO.renderIncidents = function(){
  var list = SO.G.pendingIncidents.slice().reverse();
  var hasMinor = list.some(function(i){return i.severity==='minor';});
  var html = '';
  if(hasMinor){
    html += '<div style="margin-bottom:12px;"><button class="btn bgood" data-bulk="minor">Brush Off All Minor</button></div>';
  }
  if(!list.length){
    html += '<div class="empty-note">Nothing pending. Quiet day on the desk.</div>';
    SO.$('incidentList').innerHTML = html;
    return;
  }
  list.forEach(function(inc){
    var s = SO.byId(inc.staffId);
    if(!s) return;
    var actions = '<button class="btn" data-open="'+s.id+'">View File</button>';
    if(inc.severity==='commend'){
      actions += '<button class="btn bgood" data-inc="'+inc.id+'" data-act="commend">Commend</button>'+
        '<button class="btn" data-inc="'+inc.id+'" data-act="brushoff">Acknowledge</button>';
    } else if(inc.severity==='minor'){
      actions += '<button class="btn bgood" data-inc="'+inc.id+'" data-act="brushoff">Brush Off</button>'+
        '<button class="btn bwarn" data-inc="'+inc.id+'" data-act="warn">Warn</button>';
    } else {
      actions += '<button class="btn bwarn" data-inc="'+inc.id+'" data-act="warn">Warn</button>'+
        '<button class="btn bwarn" data-inc="'+inc.id+'" data-act="restrict">Restrict</button>'+
        (s.rank>0?'<button class="btn bdanger" data-inc="'+inc.id+'" data-act="demote">Demote</button>':'')+
        '<button class="btn bdanger" data-inc="'+inc.id+'" data-act="terminate">Terminate</button>'+
        '<button class="btn" data-inc="'+inc.id+'" data-act="ignore">Ignore</button>';
    }
    var evNote = '';
    if(inc.severity!=='commend'){
      var evLabel = inc.evidence>=2 ? 'Well-documented case' : 'Thin evidence \u2014 acting harshly here may trigger an appeal';
      evNote = '<div class="evidence-note">'+evLabel+'</div>';
    }
    html += '<div class="incident-card sev-'+inc.severity+'">'+
      '<div class="incident-head"><span class="sev-badge sev-'+inc.severity+'">'+inc.severity.toUpperCase()+'</span>'+
      '<span class="mono" style="color:var(--text-dim);font-size:11px;">Day '+inc.day+' \u00b7 '+SO.RANKS[s.rank]+'</span></div>'+
      '<div class="incident-desc">'+inc.desc+'</div>'+evNote+
      '<div class="incident-actions">'+actions+'</div></div>';
  });
  SO.$('incidentList').innerHTML = html;
};

SO.renderDraft = function(){
  if(!SO.G.draftNews.length){
    SO.$('draftList').innerHTML = '<div class="empty-note">Nothing queued for next Monday yet. Open a staff file to queue a promotion or demotion.</div>';
    return;
  }
  var html = '';
  SO.G.draftNews.forEach(function(d){
    var s = SO.byId(d.staffId);
    if(!s) return;
    html += '<div class="draftrow"><span class="mono">'+s.username+'</span>'+
      '<span class="arrow">'+SO.RANKS[d.fromRank]+' &rarr; '+SO.RANKS[d.toRank]+'</span>'+
      '<button class="btn" style="margin-left:auto" data-unqueue="'+s.id+'">Cancel</button></div>';
  });
  SO.$('draftList').innerHTML = html;
};

SO.renderElections = function(){
  if(!SO.G.elections.length){
    SO.$('electionList').innerHTML = '<div class="empty-note">No open seats right now.</div>';
    return;
  }
  var html = '';
  SO.G.elections.forEach(function(el){
    html += '<div class="election-card"><div class="section-title" style="margin-top:0;">Vacant: '+SO.RANKS[el.rank]+'</div>';
    el.candidates.forEach(function(cid){
      var c = SO.byId(cid);
      if(!c || c.status!=='active') return;
      html += '<div class="candidate-row"><span class="mono">'+c.username+'</span><span style="color:var(--text-dim);font-size:11px;">'+SO.RANKS[c.rank]+'</span>'+
        '<button class="btn bgood" data-elect="'+el.id+'" data-winner="'+c.id+'">Elect</button></div>';
    });
    html += '</div>';
  });
  SO.$('electionList').innerHTML = html;
};

SO.renderLog = function(){
  var html = SO.G.log.slice(0,150).map(function(l){
    return '<div class="logrow"><span class="d">Day '+l.day+'</span>'+l.text+'</div>';
  }).join('');
  SO.$('logList').innerHTML = html || '<div class="empty-note">Nothing yet.</div>';
};
