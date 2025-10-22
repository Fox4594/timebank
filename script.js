/* script.js
   Handles sign up / sign in, theme, demo seeding, and persistent storage.
*/

(() => {
  window.tb = window.tb || {};
  const tb = window.tb;

  tb.uid = (n=6) => Math.random().toString(36).slice(2, 2+n);
  tb.getData = function(){ try{ return JSON.parse(localStorage.getItem('tb_data')) || {users:[], offers:[]}; } catch(e){ return {users:[], offers:[]}; } }
  tb.saveData = function(d){ localStorage.setItem('tb_data', JSON.stringify(d)); }
  tb.getCurrent = function(){ return localStorage.getItem('tb_current') || null; }
  tb.setCurrent = function(id){ localStorage.setItem('tb_current', id); }
  tb.clearCurrent = function(){ localStorage.removeItem('tb_current'); }

  // Register
  if(document.getElementById('btnRegister')){
    document.getElementById('btnRegister').addEventListener('click', ()=>{
      const name = (document.getElementById('regName').value || '').trim();
      const email = (document.getElementById('regEmail').value || '').trim().toLowerCase();
      const start = parseInt(document.getElementById('regBalance').value || '0',10) || 0;
      if(!name || !email){ alert('Enter name and email'); return; }
      const data = tb.getData();
      if(data.users.find(u=>u.email===email)){ alert('Account exists for that email'); return; }
      const id = tb.uid(8);
      const u = {id,name,email,balance:start,offers:[], feed:[]};
      data.users.push(u);
      tb.saveData(data);
      tb.setCurrent(id);
      location.href = 'dashboard.html';
    });
  }

  // Sign in
  if(document.getElementById('btnSignIn')){
    document.getElementById('btnSignIn').addEventListener('click', ()=>{
      const email = (document.getElementById('signEmail').value || '').trim().toLowerCase();
      if(!email){ alert('Enter email'); return; }
      const data = tb.getData();
      const u = data.users.find(x=>x.email===email);
      if(!u){ alert('No account found. Create one or try a demo.'); return; }
      tb.setCurrent(u.id);
      location.href = 'dashboard.html';
    });
  }

  // Sign out on dashboard is handled in dashboard.js

  // Demo loaders
  window.loadDemo = function(which){
    const data = tb.getData();
    function ensure(name,email,start){
      let ex = data.users.find(u=>u.email===email);
      if(!ex){
        ex = {id:tb.uid(8), name, email, balance:start, offers:[], feed:[]};
        data.users.push(ex);
      }
      return ex;
    }
    if(which === 'Alex')      ensure('Alex','alex@auto',4);
    if(which === 'Taylor')    ensure('Taylor','taylor@auto',3);
    if(which === 'Jordan')    ensure('Jordan','jordan@auto',3);
    if(which === 'Casey')     ensure('Casey','casey@auto',2);
    // some preloaded offers for realism
    if(data.offers.length === 0){
      const a = data.users.find(u=>u.email==='alex@auto');
      const t = data.users.find(u=>u.email==='taylor@auto');
      if(a) data.offers.push({id:tb.uid(8), title:'Quick tech help (30m)', hours:1, ownerId:a.id, createdAt:Date.now()});
      if(t) data.offers.push({id:tb.uid(8), title:'Art portfolio review', hours:1, ownerId:t.id, createdAt:Date.now()});
    }
    tb.saveData(data);
    const chosen = data.users.find(u=>u.name === which);
    if(chosen){ tb.setCurrent(chosen.id); location.href = 'dashboard.html'; } else alert('Demo created — try signing in.');
  };

  // seed community members on first load (Alex, Taylor, Jordan, Casey)
  (function seedMembers(){
    const data = tb.getData();
    if(!localStorage.getItem('tb_members_seeded')){
      const names = [
        {n:'Alex', e:'alex@auto', s:4},
        {n:'Taylor', e:'taylor@auto', s:3},
        {n:'Jordan', e:'jordan@auto', s:3},
        {n:'Casey', e:'casey@auto', s:2}
      ];
      names.forEach(item => {
        if(!data.users.find(u=>u.email===item.e)){
          data.users.push({id:tb.uid(8), name:item.n, email:item.e, balance:item.s, offers:[], feed:[]});
        }
      });
      // small sample offers
      const a = data.users.find(u=>u.email==='alex@auto');
      const j = data.users.find(u=>u.email==='jordan@auto');
      if(a) data.offers.push({id:tb.uid(8), title:'1-on-1 math tutoring', hours:1, ownerId:a.id, createdAt:Date.now()});
      if(j) data.offers.push({id:tb.uid(8), title:'Moving help (2 people)', hours:2, ownerId:j.id, createdAt:Date.now()});
      tb.saveData(data);
      localStorage.setItem('tb_members_seeded','1');
    }
  })();

  // Theme apply on index as well
  if(!localStorage.getItem('tb_theme')) localStorage.setItem('tb_theme','light');

})();
