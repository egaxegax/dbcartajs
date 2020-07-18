//
// Add metrics, analytics codes
//
function ifLocal(){
  return !navigator.onLine || String(window.location).match(/file:|localhost/);
}
function addYaMetrics(){
  // Yandex.Metrika counter
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

  ym(65044687, "init", {
  clickmap:true,
  trackLinks:true,
  accurateTrackBounce:true
  });
  console.log('+ym');
}
function addGoogleMetrics(){
  // Google Analytics
  let script = document.createElement('script');
  script.type = 'text/javascript';
  script.src  = 'https://www.googletagmanager.com/gtag/js?id=UA-25857345-4';
  document.head.appendChild(script);
  // ---------
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-25857345-4');
  console.log('+gm');
}
if(! ifLocal()){
  addYaMetrics();
  addGoogleMetrics();
}