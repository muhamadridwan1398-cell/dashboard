/* Service worker Dashboard Q-BIG. Halaman selalu diambil dari jaringan lebih dulu (supaya update
   dari GitHub langsung terlihat), salinan tersimpan dipakai saat offline atau jaringan lambat.
   Data (Supabase, Google Sheets, API) tidak pernah di-cache oleh worker ini. */
var V='qbig-pwa-v2',SHELL=['./','manifest.webmanifest','pwa.js','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
function put(req,res){if(res&&res.ok&&res.type!=='opaque'){var c=res.clone();caches.open(V).then(function(ch){ch.put(req,c)})}return res}
function netFirst(req,ms){return new Promise(function(ok){var done=false,t=setTimeout(function(){caches.match(req).then(function(m){if(m&&!done){done=true;ok(m)}})},ms);
  fetch(req,{cache:'no-cache'}).then(function(r){clearTimeout(t);if(!done){done=true;ok(put(req,r))}else put(req,r)}).catch(function(){clearTimeout(t);caches.match(req).then(function(m){if(!done){done=true;ok(m||new Response('Offline dan belum ada salinan halaman ini. Buka sekali saat online.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}))}})})})}
function cacheFirst(req){return caches.match(req).then(function(m){return m||fetch(req).then(function(r){return put(req,r)})})}
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;var u=new URL(req.url);
  if(u.origin===location.origin){
    if(req.mode==='navigate'||/\.(html|js|webmanifest)$/.test(u.pathname)||u.pathname.slice(-1)==='/'){e.respondWith(netFirst(req,req.mode==='navigate'?6000:4000));return}
    e.respondWith(cacheFirst(req));return}
  if(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.hostname)){e.respondWith(cacheFirst(req));return}
});
