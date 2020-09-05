//
// Add metrics, analytics codes
//
if(!String(window.location).match(/file:|localhost/)){
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://egaxegax.github.io/static/js/metrics.js';
  document.head.appendChild(script);
}