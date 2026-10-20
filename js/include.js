/* Loads every <div data-include="file.html"> from the server, then starts app.js. */
(function(){
  var holes=Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
  Promise.all(holes.map(function(h){
    var f=h.getAttribute('data-include');
    return fetch(f).then(function(r){if(!r.ok)throw new Error(f+' ('+r.status+')');return r.text()}).then(function(t){h.outerHTML=t});
  })).then(function(){
    ['js/app.js','js/kcal.js'].forEach(function(src){var sc=document.createElement('script');sc.src=src;sc.async=false;document.body.appendChild(sc);});
  }).catch(function(e){
    document.body.innerHTML='<div style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:24px"><h2>XTeam could not load its page parts</h2><p>'+e.message+'</p><p>index.html might not be served from a static host or a local web server.</p></div>';
  });
})();
