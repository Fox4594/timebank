/* dashboard.js
   Private feeds per user, bots named Alex/Taylor/Jordan/Casey, theme, toasts and actions.
*/

(function(){
  const tb = window.tb;
  if(!tb){ console.error('script.js must load first'); return; }

  // elements
  const userNameEl = document.getElementById('userName');
  const userBalanceEl = document.getElementById('userBalance');
  const offersList = document.getElementById('offersList');
  const myOffers = document.getElementById('myOffers');
  const feed = document.getElementById('feed');
  const preset = document.getElementById('presetSelect');
  const toasts = document.getElementById('toasts');
  const ping = document.getElementById('notifySound');

  // data & current
  let data = tb.getData();
  const currentId = tb.getCurrent();
  if(!currentId){ location.href = 'index.html'; return; }

  function getUser(){ data = tb.getData(); return data.users.find(u=>u.id === currentId); }
  function save(){ tb.saveData(data); }

  // UI refresh
  function refreshUI(){
    const u = getUser();
    if(!u) { location.href='index.html'; return; }
    userNameEl.textContent = u.name;
    userBalanceEl.textContent = u.balance + ' hrs';
    document.getElementById('topUser').textContent = u.name;
    renderOffers();
    renderMyOffers();
    renderFeed();
  }

  // render offers
  function renderOffers(){
    offersList.innerHTML = '';
    if(data.offers.length === 0){ offersList.innerHTML = '<div class="small muted">No offers posted yet.</div>'; return; }
    data.offers.slice().reverse().forEach(o=>{
      const owner = data.users.find(x=>x.id===o.ownerId);
      const card = document.createElement('div'); card.className='offer-card';
      card.innerHTML = `<div>
          <div style="font-weight:700">${o.title}</div>
          <div class="offer-meta">${o.hours} hr • by ${owner?owner.name:'Unknown'}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ghost" data-id="${o.id}" data-action="view">View</button>
          <button data-id="${o.id}" data-action="request">Request</button>
        </div>`;
      offersList.appendChild(card);
    });
    // wire
    Array.from(offersList.querySelectorAll('button')).forEach(b=>{
      b.addEventListener('click',(e)=>{
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        if(action === 'view'){
          const o = data.offers.find(x=>x.id===id); const owner = data.users.find(x=>x.id===o.ownerId);
          alert(`${o.title}\n\nHours: ${o.hours}\nBy: ${owner?owner.name:'Unknown'}`);
        } else handleRequest(id);
      });
    });
  }

  // render my offers
  function renderMyOffers(){
    const u = getUser();
    const mine = data.offers.filter(o=>o.ownerId === u.id);
    if(mine.length===0) myOffers.innerHTML = '<div class="small muted">You have no posted offers.</div>';
    else {
      myOffers.innerHTML = '';
      mine.forEach(o=>{
        const el = document.createElement('div'); el.style.marginBottom='8px';
        el.innerHTML = `<div style="font-weight:700">${o.title}</div><div class="small muted">${o.hours} hr</div>
        <div style="margin-top:6px"><button class="ghost" data-id="${o.id}" data-action="remove">Remove</button></div>`;
        myOffers.appendChild(el);
      });
      Array.from(myOffers.querySelectorAll('button')).forEach(b=>{
        b.addEventListener('click', (e)=>{
          const id = e.target.getAttribute('data-id');
          data.offers = data.offers.filter(x=>x.id !== id);
          save();
          refreshUI();
        });
      });
    }
  }

  // render private feed (for current user only)
  function renderFeed(){
    const u = getUser();
    feed.innerHTML = '';
    const list = (u.feed || []).slice().reverse();
    if(list.length === 0) { feed.innerHTML = '<div class="small muted">No messages yet — bots will interact soon.</div>'; return; }
    list.slice(0,200).forEach(item=>{
      const d = document.createElement('div'); d.className='feed-item';
      d.innerHTML = `<div style="font-weight:700">${item.title}</div><div class="small muted">${new Date(item.time).toLocaleTimeString()} • ${item.msg}</div>`;
      feed.appendChild(d);
    });
  }

  // push to a specific user's private feed
  function pushToUser(userId, title, msg){
    const user = data.users.find(u=>u.id === userId);
    if(!user) return;
    user.feed = user.feed || [];
    user.feed.push({id: tb.uid(8), title, msg, time: Date.now()});
    // cap length
    if(user.feed.length > 800) user.feed.shift();
    save();
    // if current user is the recipient, show UI & toast
    if(userId === currentId){
      renderFeed();
      showToast(title, msg);
    }
  }

  // toast with sound
  function showToast(title,msg){
    const t = document.createElement('div'); t.className='toast';
    t.innerHTML = `<div style="font-weight:800">${title}</div><div class="small muted">${msg}</div>`;
    toasts.appendChild(t);
    // play sound
    try{ ping.play(); } catch(e){}
    setTimeout(()=> { t.style.opacity = '0'; setTimeout(()=> t.remove(), 700); }, 4200);
  }

  // add offer
  document.getElementById('btnAddOffer').addEventListener('click', ()=>{
    const title = document.getElementById('offerTitle').value.trim() || document.getElementById('presetSelect').value;
    const hours = parseInt(document.getElementById('offerHours').value || '1', 10) || 1;
    if(!title){ alert('Add a service title or choose a preset'); return; }
    const id = tb.uid(8);
    const u = getUser();
    data.offers.push({id, title, hours, ownerId: u.id, createdAt: Date.now()});
    save();
    // push a private feed entry to this user
    pushToUser(u.id, 'Offer posted', `${u.name} posted "${title}" (${hours} hr)`);
    document.getElementById('offerTitle').value = '';
    refreshUI();
  });

  // request handling (immediate in demo)
  function handleRequest(offerId){
    const offer = data.offers.find(o=>o.id === offerId);
    if(!offer){ alert('Offer not found'); return; }
    const owner = data.users.find(u=>u.id === offer.ownerId);
    const requester = getUser();
    if(owner.id === requester.id){ alert('You cannot request your own offer'); return; }
    // update balances
    requester.balance = (requester.balance || 0) - offer.hours;
    owner.balance = (owner.balance || 0) + offer.hours;
    save();
    // push private messages to requester and owner
    pushToUser(requester.id, 'Service requested', `You requested "${offer.title}" from ${owner.name} — ${offer.hours} hr transferred`);
    pushToUser(owner.id, 'Service provided', `${requester.name} requested your "${offer.title}" — you've earned ${offer.hours} hr`);
    refreshUI();
  }

  // simulate button - creates random activity targeted at current user sometimes
  document.getElementById('btnSimulate').addEventListener('click', ()=> {
    const members = data.users.filter(u => u.email && (u.email.includes('@auto') || u.email.includes('@demo')));
    const samples = ['Grocery run', 'Resume review', 'Math tutoring', 'Moving help', 'Laptop help'];
    const rand = samples[Math.floor(Math.random()*samples.length)];
    const randMember = members[Math.floor(Math.random()*members.length)];
    if(randMember){
      const id = tb.uid(8);
      data.offers.push({id, title: rand, hours:1, ownerId: randMember.id, createdAt: Date.now()});
      save();
      // sometimes target current user with a notification
      if(Math.random() < 0.6) {
        pushToUser(currentId, 'New nearby offer', `${randMember.name} posted "${rand}" — check Available offers`);
      }
      refreshUI();
    }
  });

  document.getElementById('btnClearFeed').addEventListener('click', ()=>{
    if(!confirm('Clear your private feed?')) return;
    const u = getUser(); u.feed = []; save(); renderFeed();
  });

  // sign out
  document.getElementById('btnSignOut').addEventListener('click', ()=>{
    tb.clearCurrent();
    location.href = 'index.html';
  });

  // BOT SYSTEM (Alex, Taylor, Jordan, Casey)
  function getMembers(){ return data.users.filter(u => ['alex@auto','taylor@auto','jordan@auto','casey@auto'].includes(u.email)); }

  // timing
  const BOT_MIN = 5000, BOT_MAX = 8000;

  function scheduleBots(){
    const members = getMembers();
    if(members.length === 0) return;
    members.forEach((m)=>{
      (function loop(member){
        const t = Math.floor(Math.random() * (BOT_MAX - BOT_MIN)) + BOT_MIN;
        setTimeout(()=>{
          // choose action: 60% post offer, 40% interact with a random real user (including current)
          const rnd = Math.random();
          if(rnd < 0.6){
            const samples = ['Grocery pickup', 'Quick tutoring (30m)', 'Laptop setup', 'Errands', 'Proofreading', 'Plant care'];
            const title = samples[Math.floor(Math.random()*samples.length)];
            const offer = {id: tb.uid(8), title, hours: 1, ownerId: member.id, createdAt: Date.now()};
            data.offers.push(offer); save();
            // notify owner's private feed
            pushToUser(member.id, 'New offer posted', `${member.name} posted "${title}"`);
            // sometimes notify current user about the new offer
            if(Math.random() < 0.5) pushToUser(currentId, 'New nearby offer', `${member.name} posted "${title}" — check Available offers`);
          } else {
            // interact: pick a random offer by another person; if none, post instead
            const otherOffers = data.offers.filter(o => o.ownerId !== member.id);
            if(otherOffers.length > 0){
              const sel = otherOffers[Math.floor(Math.random()*otherOffers.length)];
              const owner = data.users.find(u=>u.id === sel.ownerId);
              // member requests the service -> member pays hours, owner gains
              member.balance = (member.balance || 0) - sel.hours;
              owner.balance = (owner.balance || 0) + sel.hours;
              save();
              // message goes privately to the owner and sometimes to the current user if they're the owner
              pushToUser(owner.id, 'Your offer used', `${member.name} requested "${sel.title}" — ${sel.hours} hr transferred`);
              // if this interaction mentioned the current user, also notify them
              if(owner.id === currentId) pushToUser(currentId, 'Someone used your offer', `${member.name} requested your "${sel.title}"`);
            } else {
              // fallback post
              const title = 'Quick help: ' + ['Errands','Tutoring','Moving help'][Math.floor(Math.random()*3)];
              const offer = {id:tb.uid(8), title, hours:1, ownerId:member.id, createdAt:Date.now()};
              data.offers.push(offer); save();
              pushToUser(member.id, 'New offer posted', `${member.name} posted "${title}"`);
              if(Math.random() < 0.5) pushToUser(currentId, 'New nearby offer', `${member.name} posted "${title}"`);
            }
          }
          // loop
          loop(member);
        }, t);
      })(m);
    });
  }

  // start
  scheduleBots();
  refreshUI();

  // storage listener: update if changes happen elsewhere
  window.addEventListener('storage', (e)=>{
    if(e.key === 'tb_data'){ data = tb.getData(); refreshUI(); }
  });

  // expose for debug
  window.tbApp = { refreshUI };

})();
