
var SO = window.SO = window.SO || {};

SO.selectedDifficulty = 'standard';

SO.showIntro = function(){
  SO.$('app').classList.add('hidden');
  SO.$('introOverlay').classList.remove('hidden');
  SO.$('continueBtn').style.display = SO.hasSave() ? 'block' : 'none';
};
SO.startGameFromIntro = function(){
  var name = SO.$('serverNameInput').value.trim();
  var owner = SO.$('ownerNameInput').value.trim();
  SO.newGame(name, owner, SO.selectedDifficulty);
  SO.$('introOverlay').classList.add('hidden');
  SO.$('app').classList.remove('hidden');
  SO.renderAll();
};
SO.continueGame = function(){
  if(SO.loadGame()){
    SO.$('introOverlay').classList.add('hidden');
    SO.$('app').classList.remove('hidden');
    SO.renderAll();
  } else {
    SO.toast('No valid save found.','warn');
  }
};

document.addEventListener('DOMContentLoaded', function(){

  document.querySelectorAll('.navbtn').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.navbtn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      var tab = b.getAttribute('data-tab');
      document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
      SO.$('panel-'+tab).classList.add('active');
    });
  });

  document.querySelectorAll('.diffbtn').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.diffbtn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      SO.selectedDifficulty = b.getAttribute('data-diff');
    });
  });

  SO.$('btn-staffnews').addEventListener('click', function(){
    document.querySelectorAll('.navbtn').forEach(function(x){x.classList.remove('active');});
    document.querySelector('[data-tab="draft"]').classList.add('active');
    document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
    SO.$('panel-draft').classList.add('active');
  });
  SO.$('btn-epromote').addEventListener('click', function(){ if(!SO.$('btn-epromote').disabled) SO.openEmergencyPicker('promote'); });
  SO.$('btn-edemote').addEventListener('click', function(){ if(!SO.$('btn-edemote').disabled) SO.openEmergencyPicker('demote'); });
  SO.$('btn-tiffa').addEventListener('click', SO.openTiffaModal);
  SO.$('tiffaNotifBtn').addEventListener('click', SO.openTiffaNotifDrawer);

  SO.$('eventBtn').addEventListener('click', function(){
    if(!SO.$('eventBtn').disabled){
      if(!SO.hostAppreciationEvent()) SO.toast('Event unavailable (cooldown or budget).','warn');
      SO.renderAll();
    }
  });
  SO.$('recruitBtn').addEventListener('click', function(){
    if(!SO.$('recruitBtn').disabled){
      if(!SO.doRecruit()) SO.toast('Not enough budget to recruit.','warn');
      SO.renderAll();
    }
  });
  SO.$('helpBtn').addEventListener('click', SO.openHelpModal);
  SO.$('saveBtn').addEventListener('click', function(){
    if(SO.saveGame()) SO.toast('Game saved.','good');
    else SO.toast('Save failed.','danger');
  });
  SO.$('restartBtn').addEventListener('click', function(){ if(confirm('Start a brand new game? Current progress will be lost unless saved.')) SO.showIntro(); });
  SO.$('endDayBtn').addEventListener('click', SO.endDay);
  SO.$('startBtn').addEventListener('click', SO.startGameFromIntro);
  SO.$('continueBtn').addEventListener('click', SO.continueGame);
  SO.$('serverNameInput').addEventListener('keydown', function(e){ if(e.key==='Enter') SO.startGameFromIntro(); });

  SO.$('rosterSearch').addEventListener('input', function(e){ SO.rosterState.search = e.target.value; SO.renderRoster(); });
  SO.$('rosterRankFilter').addEventListener('change', function(e){ SO.rosterState.rankFilter = e.target.value; SO.renderRoster(); });
  SO.$('rosterSort').addEventListener('change', function(e){ SO.rosterState.sort = e.target.value; SO.renderRoster(); });

  document.addEventListener('click', function(e){
    var el;
    if((el = e.target.closest('[data-close]'))){ SO.closeModal(); return; }
    if((el = e.target.closest('[data-open]'))){ SO.openProfile(+el.getAttribute('data-open')); return; }
    if((el = e.target.closest('[data-unqueue]'))){
      var s0 = SO.byId(+el.getAttribute('data-unqueue'));
      if(s0 && s0.queued) SO.toggleQueue(s0, s0.queued.type);
      SO.renderAll();
      return;
    }
    if((el = e.target.closest('[data-bulk]'))){
      var bulkType = el.getAttribute('data-bulk');
      if(bulkType==='minor') SO.bulkResolveMinor();
      return;
    }
    if((el = e.target.closest('[data-act-staff]'))){
      var act = el.getAttribute('data-act-staff');
      var sid = +el.getAttribute('data-id');
      var s = SO.byId(sid);
      if(!s) return;
      if(act==='epromote'){ SO.confirmEmergency(s.id,'promote'); return; }
      if(act==='edemote'){ SO.confirmEmergency(s.id,'demote'); return; }
      if(act==='terminate'){ SO.confirmTerminate(s.id,{context:'profile'}); return; }
      if(act==='pickmentee'){ SO.openMentorPicker(s.id); return; }
      if(act==='unmentor'){ SO.unassignMentor(s); SO.toast('Mentorship ended.','info'); }
      else if(act==='investigate'){ if(!SO.doInvestigate(s)) SO.toast('No investigations left today.','warn'); }
      else if(act==='praise'){ if(!SO.doPraise(s)) SO.toast('Already praised them today.','warn'); }
      else if(act==='timeoff'){ if(!SO.doTimeOff(s)) SO.toast("They're still recovering from their last time off.",'warn'); }
      else if(act==='bonus'){ if(!SO.doBonusPay(s)) SO.toast('Not enough budget.','warn'); }
      else if(act==='queuepromote'){ SO.toggleQueue(s,'promote'); }
      else if(act==='queuedemote'){ SO.toggleQueue(s,'demote'); }
      else if(act==='warn'){ SO.doWarn(s); }
      else if(act==='restrict'){ SO.doRestrict(s); }
      SO.recomputeMeters();
      SO.checkWinCondition();
      SO.renderAll();
      SO.openProfile(sid);
      return;
    }
    if((el = e.target.closest('[data-mentee]'))){
      var menteeId = +el.getAttribute('data-mentee');
      var mentorId = +el.getAttribute('data-mentor');
      var mentee = SO.byId(menteeId), mentor = SO.byId(mentorId);
      if(mentor && mentee){
        SO.assignMentor(mentor, mentee);
        SO.toast('Mentorship assigned.','good');
      }
      SO.renderAll();
      SO.openProfile(mentorId);
      return;
    }
    if((el = e.target.closest('[data-inc]'))){
      var incId = el.getAttribute('data-inc');
      var act2 = el.getAttribute('data-act');
      var inc = SO.G.pendingIncidents.find(function(i){return i.id===incId;});
      if(!inc) return;
      if(act2==='terminate'){ SO.confirmTerminate(inc.staffId,{context:'incident',incId:incId}); return; }
      SO.resolveIncident(incId, act2);
      return;
    }
    if((el = e.target.closest('[data-majoract]'))){
      var act3 = el.getAttribute('data-majoract');
      var inc0 = SO.G.majorPopupQueue[0];
      if(!inc0) return;
      if(act3==='terminate'){ SO.confirmTerminate(inc0.staffId,{context:'majorpopup'}); return; }
      SO.resolveMajorPopup(act3);
      return;
    }
    if((el = e.target.closest('[data-emp]'))){
      var empId = +el.getAttribute('data-emp');
      var type = el.getAttribute('data-type');
      SO.confirmEmergency(empId, type);
      return;
    }
    if((el = e.target.closest('[data-elect]'))){
      var elId = el.getAttribute('data-elect');
      var winnerId = +el.getAttribute('data-winner');
      SO.resolveElection(elId, winnerId);
      SO.recomputeMeters();
      SO.checkWinCondition();
      SO.renderAll();
      SO.closeModal();
      SO.advanceQueueOrMonday();
      return;
    }
  });

  SO.showIntro();
});
