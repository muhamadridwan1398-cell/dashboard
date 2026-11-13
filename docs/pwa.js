/* Pendaftaran aplikasi (PWA): service worker, tombol Menu saat berjalan sebagai aplikasi, dan pasang aplikasi. */
(function(){
  var me=document.currentScript,base=me?new URL('.',me.src).href:location.href;
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    var had=!!navigator.serviceWorker.controller,rl=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(!had||rl)return;rl=true;try{if(sessionStorage.getItem('qbigSwReload')==='1')return;sessionStorage.setItem('qbigSwReload','1')}catch(e){}location.reload()});
    window.addEventListener('load',function(){navigator.serviceWorker.register(new URL('sw.js',base).href,{scope:base}).catch(function(){})})}
  var sa=function(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true};
  window.qbigStandalone=sa;
  var home=location.href.replace(/[?#].*$/,'')!==base&&location.href.replace(/[?#].*$/,'')!==base+'index.html';
  if(sa()&&home){
    var st=document.createElement('style');st.textContent='#qbHome{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:6px;padding:9px 14px 9px 11px;border-radius:999px;background:#14284b;color:#fff;font:600 13px/1 "Segoe UI",system-ui,Arial,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(10,20,50,.35);opacity:.92}#qbHome:hover,#qbHome:focus-visible{opacity:1;outline:2px solid #f2a71b;outline-offset:2px}@media print{#qbHome{display:none}}body.capture-mode #qbHome{display:none}';
    document.head.appendChild(st);
    var a=document.createElement('a');a.id='qbHome';a.href=base;a.setAttribute('aria-label','Kembali ke menu dashboard');a.innerHTML='<span aria-hidden="true">◂</span> Menu';
    (document.body?Promise.resolve():new Promise(function(r){document.addEventListener('DOMContentLoaded',r)})).then(function(){document.body.appendChild(a)})}
  /* tombol pasang (dipakai di halaman menu) */
  var dp=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;document.dispatchEvent(new Event('qbig-installable'))});
  window.addEventListener('appinstalled',function(){dp=null;document.dispatchEvent(new Event('qbig-installed'))});
  window.qbigInstall=function(){if(!dp)return Promise.resolve('none');dp.prompt();return dp.userChoice.then(function(c){dp=null;return c.outcome})};
  window.qbigCanInstall=function(){return !!dp};
})();
