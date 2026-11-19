/* 案D/E/F 共通の動き。build.py が {{MOTION}} に差し込む */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* 1. スクロールで現れる（.rv → .in） */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.dataset.count) countUp(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rv,[data-count]').forEach(function (el) {
    if (el.dataset.d) el.style.transitionDelay = el.dataset.d + 'ms';
    if (reduce) { el.classList.add('in'); if (el.dataset.count) el.textContent = el.dataset.count; }
    else io.observe(el);
  });

  /* 2. 数字が増えていく */
  function countUp(el) {
    var to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* 3. スクロール量（進み具合バー・視差・浮遊ボタンの出し入れ） */
  var px = [].slice.call(document.querySelectorAll('[data-px]'));
  var hz = document.querySelector('[data-hscroll]');
  var ticking = false;
  function onScroll() {
    var y = scrollY, h = document.body.scrollHeight - innerHeight;
    root.style.setProperty('--sp', (h > 0 ? y / h : 0).toFixed(4));
    document.body.classList.toggle('scrolled', y > innerHeight * 0.6);
    var pxOn = !reduce && innerWidth > 900;
    px.forEach(function (el) {
      if (!pxOn) { el.style.transform = ''; return; }
      var r = el.getBoundingClientRect(), c = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (c * +el.dataset.px).toFixed(1) + 'px,0)';
    });
    if (hz && innerWidth > 900) {
      var box = hz.getBoundingClientRect(), track = hz.querySelector('.track');
      var max = track.scrollWidth - innerWidth + 80;
      var p = Math.min(1, Math.max(0, -box.top / (box.height - innerHeight)));
      track.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
      hz.style.setProperty('--hp', p.toFixed(3));
    }
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* 4. 磁石のように吸い寄せられるボタン（.mag） */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* 5. ボタンのクリック計測デモ（本番は GA4 にイベント送信） */
  window.dataLayer = window.dataLayer || [];
  var toast = document.createElement('div');
  toast.className = 'cta-toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var tt;
  var LABEL = { tel: '電話ボタン', line: 'LINE予約ボタン', web: 'WEB予約ボタン' };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-cta]');
    if (!a) return;
    var kind = a.dataset.cta, place = a.dataset.place || a.closest('[data-place]')?.dataset.place || 'ページ内';
    window.dataLayer.push({ event: 'cta_click', cta_type: kind, cta_place: place, page_path: location.pathname });
    if (!document.body.classList.contains('cta-demo')) return;
    e.preventDefault();
    toast.innerHTML = '<b>計測デモ</b>「' + place + '」の' + LABEL[kind] + 'が押されたことを記録しました<small>本番では' +
      (kind === 'tel' ? 'このまま電話がかかります' : kind === 'line' ? 'LINEの友だち追加が開きます' : '予約画面が開きます') + '</small>';
    toast.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove('on'); }, 3200);
  });

  /* 6. 予約ボタンの展開（.dial） */
  document.querySelectorAll('.dial-toggle').forEach(function (t) {
    t.addEventListener('click', function () {
      var d = t.closest('.dial'); var open = d.classList.toggle('open');
      t.setAttribute('aria-expanded', open);
    });
  });
})();

/* ---- スマホ向けの共通部品 ---- */
(function () {
  var body = document.body, mob = function () { return innerWidth <= 900; };
  /* 上まで戻ったか */
  function top0() { body.classList.toggle('top0', scrollY > 40); }
  addEventListener('scroll', top0, { passive: true }); top0();
  /* メニュー */
  var btn = document.querySelector('.m-btn'), menu = document.querySelector('.m-menu');
  function setMenu(on) {
    body.classList.toggle('m-on', on);
    if (btn) { btn.setAttribute('aria-expanded', on); btn.setAttribute('aria-label', on ? 'メニューを閉じる' : 'メニューを開く'); }
    if (menu) menu.setAttribute('aria-hidden', !on);
  }
  if (btn) btn.addEventListener('click', function () { setMenu(!body.classList.contains('m-on')); });
  if (menu) menu.querySelectorAll('nav a,.sub a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* 今、受付中か（日本時間） */
  var H = { 1: [[510, 720], [900, 1140]], 2: [[510, 720], [900, 1140]], 3: [[510, 750]], 4: [[510, 720], [900, 1140]], 5: [[510, 720], [900, 1140]], 6: [[510, 750]], 0: [] };
  var W = ['日', '月', '火', '水', '木', '金', '土'];
  function fmt(m) { return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  var j = new Date(Date.now() + 9 * 3600e3), dow = j.getUTCDay(), now = j.getUTCHours() * 60 + j.getUTCMinutes();
  var text, open = false, today = H[dow];
  for (var i = 0; i < today.length; i++) {
    if (now >= today[i][0] && now < today[i][1]) { open = true; text = '受付中・本日は' + fmt(today[i][1]) + 'まで'; break; }
    if (now < today[i][0]) { text = (i ? 'お昼休み中・' : '本日は') + fmt(today[i][0]) + 'から受付'; break; }
  }
  if (!text) {
    for (var d = 1; d <= 7; d++) { var nd = (dow + d) % 7; if (H[nd].length) { text = (today.length ? '本日の受付は終了・' : '本日は休診日・') + '次は' + (d === 1 ? '明日' : W[nd] + '曜') + ' ' + fmt(H[nd][0][0]) + 'から'; break; } }
  }
  document.querySelectorAll('[data-open]').forEach(function (el) { el.textContent = text; el.closest('.open-chip').classList.toggle('is-open', open); });
  /* 受付時間の表で今日の列に色 */
  var col = dow === 0 ? 8 : dow + 1;
  document.querySelectorAll('table').forEach(function (t) {
    t.querySelectorAll('tr').forEach(function (tr) { var c = tr.children[col - 1]; if (c) c.classList.add('today'); });
  });

  /* 横にめくる部品の点 */
  document.querySelectorAll('[data-dots]').forEach(function (el) {
    var items = [].filter.call(el.children, function (c) { return !c.hasAttribute('aria-hidden'); });
    var dots = document.createElement('div'); dots.className = 'snap-dots'; dots.setAttribute('aria-hidden', 'true');
    items.forEach(function () { dots.appendChild(document.createElement('i')); });
    el.after(dots);
    function upd() {
      if (!mob()) return;
      var w = items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 12);
      var k = Math.min(items.length - 1, Math.round(el.scrollLeft / w));
      [].forEach.call(dots.children, function (d, n) { d.classList.toggle('on', n === k); });
    }
    el.addEventListener('scroll', upd, { passive: true }); upd();
  });
})();

(function(){var box=document.querySelector('.slides'),bar=document.querySelector('.sbar');if(!box)return;
var f=[].slice.call(box.querySelectorAll('figure')),i=0,t,D=5500,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
bar.style.setProperty('--dur',D+'ms');
var b=f.map(function(_,n){var x=document.createElement('button');x.type='button';x.setAttribute('aria-label',(n+1)+'枚目の写真');x.onclick=function(){go(n)};bar.appendChild(x);return x});
function go(n){f[i].classList.remove('on');i=(n+f.length)%f.length;f[i].classList.add('on');
b.forEach(function(x,k){x.classList.remove('on');x.classList.toggle('done',k<i);});void b[i].offsetWidth;b[i].classList.add('on');
clearTimeout(t);if(!still)t=setTimeout(function(){go(i+1)},D);}
go(0);document.addEventListener('visibilitychange',function(){if(document.hidden)clearTimeout(t);else go(i)});})();
/* 空き状況：予約システム（data-api）から読み込み、1週間 × 午前・午後の表で見せる。つながらないときはサンプル表示 */
(function(){var root=document.querySelector('.avail');if(!root)return;
var API=root.dataset.api,thead=root.querySelector('.av-grid thead'),tbody=root.querySelector('.av-grid tbody'),out=root.querySelector('.av-slots'),
 st=root.querySelector('[data-av-status]'),soon=root.querySelector('[data-av-soon]'),range=root.querySelector('[data-av-range]'),
 prev=root.querySelector('[data-av-prev]'),next=root.querySelector('[data-av-next]'),tabs=[].slice.call(root.querySelectorAll('.av-tabs button'));
var W=['日','月','火','水','木','金','土'],HOURS={0:[],1:[[510,720],[900,1140]],2:[[510,720],[900,1140]],3:[[510,750]],4:[[510,720],[900,1140]],5:[[510,720],[900,1140]],6:[[510,750]]};
var SPEC={first:{min:60,lane:'main'},insurance:{min:30,lane:'main'},seitai:{min:40,lane:'main'},esthe:{min:60,lane:'esthe'}};
var cache={},sample=false,cur={menu:'first',week:0,date:null,half:null};
function hm(m){return Math.floor(m/60)+':'+('0'+m%60).slice(-2)}
function parts(d){var p=d.split('-');return{m:+p[1],d:+p[2],w:new Date(Date.UTC(+p[0],p[1]-1,+p[2])).getUTCDay()}}
function addDays(d,n){var p=d.split('-');return new Date(Date.UTC(+p[0],p[1]-1,+p[2])+n*864e5).toISOString().slice(0,10)}
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function makeSample(menu){var sp=SPEC[menu],today=new Date(Date.now()+9*36e5).toISOString().slice(0,10),list=[],pmS=sp.lane==='esthe'?900:780;
 var win=sp.lane==='esthe'?[[510,660],[900,1080]]:null;
 for(var i=1;i<=14;i++){var date=addDays(today,i),r=HOURS[parts(date).w],all=[];
  r.forEach(function(x){for(var s=x[0];s+sp.min<=x[1]&&s<=x[1]-30;s+=30){if(win&&!win.some(function(w){return s>=w[0]&&s+sp.min<=w[1]}))continue;var h=hash(date+s+menu)%7;all.push({start:s,left:h<3?0:1})}});
  var half=function(am){var l=all.filter(function(s){return am?s.start<pmS:s.start>=pmS});return{open:l.filter(function(s){return s.left}).length,total:l.length}};
  list.push({date:date,closed:!r.length,slots:all.filter(function(s){return s.left}),halves:{am:half(true),pm:r.some(function(x){return x[1]>pmS})?half(false):null}})}
 return{menu:{id:null,kind:menu,lane:sp.lane,minutes:sp.min},today:today,pmStart:pmS,days:list}}
function load(menu){if(cache[menu])return Promise.resolve(cache[menu]);if(sample||!API)return Promise.resolve(cache[menu]=makeSample(menu));
 var c=new AbortController(),t=setTimeout(function(){c.abort()},6000);
 return fetch(API+'/api/availability?menu='+menu+'&days=14',{signal:c.signal}).then(function(r){if(!r.ok)throw 0;return r.json()})
  .then(function(j){clearTimeout(t);if(!j.days||!j.days[0]||!j.days[0].halves)throw 0;return cache[menu]=j}).catch(function(){sample=true;return cache[menu]=makeSample(menu)})}
/* 午前・午後の印：空き枠の割合で決める */
function mark(d,h){if(d.closed)return{t:'休',c:'x',l:'休診'};var x=d.halves[h];if(!x||!x.total)return{t:'－',c:'x',l:'受付なし'};
 if(!x.open)return{t:'×',c:'x',l:'満員'};var r=x.open/x.total;return r>=.5?{t:'◎',c:'a',l:'空きあり'}:r>=.25?{t:'○',c:'b',l:'やや混雑'}:{t:'△',c:'c',l:'残りわずか'}}
function status(){if(sample){st.className='av-status sample';st.textContent='サンプル表示（予約システムにつながると、実際の空き状況に切り替わります）'}
 else{var n=new Date();st.className='av-status live';st.textContent='予約システムと連動中（'+n.getHours()+':'+('0'+n.getMinutes()).slice(-2)+' 時点）'}}
function url(data,date,start){return API+'/reserve?menu='+encodeURIComponent(data.menu.id||data.menu.kind)+'&date='+date+'&start='+start}
function dayLabel(data,date){var p=parts(date),diff=Math.round((Date.parse(date)-Date.parse(data.today))/864e5);return(diff===1?'<span class="rel">明日</span>':diff===2?'<span class="rel">あさって</span>':'')+p.m+'/'+p.d+'('+W[p.w]+')'}
function isPm(data,s){return s>=(data.pmStart||780)}
function render(data){status();var wk=data.days.slice(cur.week*7,cur.week*7+7);if(!wk.length){cur.week=0;wk=data.days.slice(0,7)}
 prev.disabled=cur.week===0;next.disabled=data.days.length<=(cur.week+1)*7;
 var a=parts(wk[0].date),b=parts(wk[wk.length-1].date);range.textContent=a.m+'/'+a.d+' 〜 '+b.m+'/'+b.d;
 thead.innerHTML='<tr><th scope="col"><span class="sr">時間帯</span></th>'+wk.map(function(d){var p=parts(d.date);return'<th scope="col" class="'+(p.w===0?'sun':p.w===6?'sat':'')+'">'+W[p.w]+'<b>'+p.d+'</b></th>'}).join('')+'</tr>';
 var pmS=data.pmStart||780,lab={am:'午前',pm:'午後'};
 if(refreshing){tbody.classList.remove('flap');soon.classList.remove('in')}var prevMarks=lastMarks;lastMarks={};
 tbody.innerHTML=['am','pm'].map(function(h,row){return'<tr><th scope="row">'+lab[h]+'<small>'+(h==='am'?'〜'+hm(pmS):hm(pmS)+'〜')+'</small></th>'+wk.map(function(d,col){var m=mark(d,h),p=parts(d.date),k=d.date+h;lastMarks[k]=m.t;
  var ch=refreshing&&prevMarks[k]&&prevMarks[k]!==m.t;
  return'<td><button type="button" style="--d:'+(col*55+row*110)+'ms" class="av-cell '+m.c+(ch?' changed':'')+'" data-date="'+d.date+'" data-half="'+h+'"'+(m.c==='x'?' disabled':'')+' aria-pressed="false" aria-label="'+p.m+'月'+p.d+'日（'+W[p.w]+'）'+lab[h]+' '+m.l+'">'+m.t+'<small>'+m.l+'</small></button></td>'}).join('')+'</tr>'}).join('');
 /* いちばん早い空き3つ */
 var list=[];data.days.some(function(d){d.slots.some(function(s){list.push({date:d.date,start:s.start});return list.length>=3});return list.length>=3});
 if(list.length){soon.hidden=false;soon.querySelector('.av-soon-list').innerHTML=list.map(function(x,i){return'<a style="--d:'+(i*90)+'ms" href="'+url(data,x.date,x.start)+'" data-start="'+x.start+'" data-date="'+x.date+'"><small>'+dayLabel(data,x.date)+'</small><b>'+hm(x.start)+'</b></a>'}).join('')}else soon.hidden=true;
 /* 選んでいる日（なければ、この週で最初に空いている枠） */
 if(!cur.date||!wk.some(function(d){return d.date===cur.date})){cur.date=null;cur.half=null;
  wk.some(function(d){return['am','pm'].some(function(h){if(mark(d,h).c!=='x'){cur.date=d.date;cur.half=h;return true}})})}
 if(!refreshing)flap();countUp(wk.reduce(function(a,d){return a+(d.closed?0:['am','pm'].reduce(function(b,h){var x=d.halves[h];return b+(x?x.open:0)},0))},0));
 pick(data);nextSlot(data);heroAv(data)}
/* 動き：マスを左上から順にめくる（画面に入ってから）・空きの数を数え上げる */
var seen=false,lastMarks={},refreshing=false,RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function flap(){tbody.classList.remove('flap');soon.classList.remove('in');if(!seen)return;void tbody.offsetWidth;tbody.classList.add('flap');soon.classList.add('in')}
if('IntersectionObserver'in window){new IntersectionObserver(function(es,o){if(es[0].isIntersecting){seen=true;flap();countUp(+cnt.dataset.to||0,true);o.disconnect()}},{threshold:.25}).observe(root.querySelector('.av-board'))}else seen=true;
var cnt=root.querySelector('[data-av-count]'),upd=root.querySelector('[data-av-upd]'),raf;
function countUp(to,force){cnt.dataset.to=to;if(!seen&&!force){cnt.textContent='0';return}var from=refreshing?(+cnt.textContent||0):0;if(RM||from===to){cnt.textContent=to;return}
 cancelAnimationFrame(raf);var t0=performance.now(),D=900;(function step(t){var k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);cnt.textContent=Math.round(from+(to-from)*e);if(k<1)raf=requestAnimationFrame(step)})(t0)}
/* 1分ごとに最新の空きを読み直し、変わったマスだけ光らせる（見えているときだけ） */
setInterval(function(){if(document.hidden||sample||!seen)return;var r=root.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
 var key=cur.menu;delete cache[key];load(key).then(function(d){if(cur.menu!==key)return;refreshing=true;render(d);refreshing=false;
  if(tbody.querySelector('.changed')){upd.hidden=false;clearTimeout(upd._t);upd._t=setTimeout(function(){upd.hidden=true},4000)}})},60000);
/* 最初の画面の「今週の空き」：初めての方の7日分を1日1つの印で */
function heroAv(data){var el=document.querySelector('[data-hero-av]');if(!el||data.menu.kind!=='first'||el.dataset.done)return;el.dataset.done=1;
 el.querySelector('.days').innerHTML=data.days.slice(0,7).map(function(d,i){var p=parts(d.date),o=0,t=0;['am','pm'].forEach(function(h){var x=d.halves[h];if(x){o+=x.open;t+=x.total}});
  var m=d.closed?{t:'休',c:'x'}:!t?{t:'－',c:'x'}:!o?{t:'×',c:'x'}:o/t>=.5?{t:'◎',c:'a'}:o/t>=.25?{t:'○',c:'b'}:{t:'△',c:'c'};
  return'<span class="dy" style="--d:'+(300+i*80)+'ms"><i class="'+(p.w===0?'sun':p.w===6?'sat':'')+'">'+W[p.w]+'</i><b>'+p.d+'</b><em class="'+m.c+'">'+m.t+'</em></span>'}).join('');
 el.setAttribute('aria-label','今週の空き状況（初めての方）を詳しく見る'+(sample?'（サンプル表示）':''));el.hidden=false}
function pick(data){[].forEach.call(tbody.querySelectorAll('.av-cell'),function(b){b.setAttribute('aria-pressed',b.dataset.date===cur.date&&b.dataset.half===cur.half)});
 var d=data.days.filter(function(x){return x.date===cur.date})[0];
 if(!d){out.innerHTML='<p class="av-none">この週は空きがありません。「›」で次の週をご覧いただくか、お電話でご相談ください。</p>';return}
 var p=parts(d.date),am=d.slots.filter(function(s){return!isPm(data,s.start)}),pm=d.slots.filter(function(s){return isPm(data,s.start)});
 function chips(l){return l.length?l.map(function(s,i){return'<a style="--d:'+Math.min(i*35,600)+'ms" href="'+url(data,d.date,s.start)+'" data-start="'+s.start+'" data-date="'+d.date+'">'+hm(s.start)+(s.left===1&&data.capacity>1?'<small>残り1枠</small>':'')+'</a>'}).join(''):'<span class="av-none">空きはありません</span>'}
 var rows=[['am','午前',am]];if(d.halves.pm)rows.push(['pm','午後',pm]);if(cur.half==='pm')rows.reverse();
 out.innerHTML='<h3>'+p.m+'月'+p.d+'日（'+W[p.w]+'）の空き時間</h3>'+rows.map(function(r){return'<div class="av-row'+(r[0]===cur.half?' on':'')+'"><b>'+r[1]+'</b><div class="av-chips">'+chips(r[2])+'</div></div>'}).join('')+
  (sample?'<p class="av-msg warn">サンプル表示のため、時間を押しても予約画面は開きません。本番では、選んだ日時が入った状態で予約画面が開きます。</p>':'<p class="av-msg">時間を押すと予約画面が開きます。お名前と電話番号を入れれば完了です。</p>')}
function nextSlot(data){var el=document.querySelector('[data-next-slot]');if(!el||data.menu.kind!=='first')return;
 var d=data.days.filter(function(x){return x.slots.length})[0];if(!d)return;var p=parts(d.date);
 el.querySelector('b').textContent=p.m+'/'+p.d+'（'+W[p.w]+'）'+hm(d.slots[0].start)+'〜'+(sample?'（サンプル）':'');el.hidden=false}
tbody.addEventListener('click',function(e){var b=e.target.closest('.av-cell');if(!b||b.disabled)return;cur.date=b.dataset.date;cur.half=b.dataset.half;load(cur.menu).then(pick);
 if(window.matchMedia('(max-width:900px)').matches)setTimeout(function(){out.scrollIntoView({behavior:'smooth',block:'nearest'})},50)});
function track(e){var a=e.target.closest('a[data-start]');if(!a)return;
 window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'slot_click',menu:cur.menu,date:a.dataset.date,start:+a.dataset.start});
 if(sample){e.preventDefault();var w=out.querySelector('.warn');if(w){w.classList.remove('flash');void w.offsetWidth;w.classList.add('flash')}}}
out.addEventListener('click',track);soon.addEventListener('click',track);
prev.addEventListener('click',function(){if(cur.week>0){cur.week--;cur.date=null;load(cur.menu).then(render)}});
next.addEventListener('click',function(){cur.week++;cur.date=null;load(cur.menu).then(render)});
tabs.forEach(function(t){t.addEventListener('click',function(){tabs.forEach(function(x){x.setAttribute('aria-selected',x===t)});cur.menu=t.dataset.menu;cur.week=0;cur.date=null;
 out.innerHTML='<p class="av-none">読み込んでいます…</p>';load(cur.menu).then(render)})});
load('first').then(render);})();

(function(){var box=document.getElementById('selfcheck');if(!box)return;var n=box.querySelector('[data-sc]'),m=box.querySelector('[data-msg]');
box.addEventListener('change',function(){var c=box.querySelectorAll('input:checked').length;n.textContent=c;
m.textContent=c===0?'気になる項目を選んでみてください。':c<3?'思い当たることがあれば、どんな小さなことでもご相談ください。':'いくつも当てはまる方は、自律神経のバランスが乱れているかもしれません。一度ご相談ください。';});})();
