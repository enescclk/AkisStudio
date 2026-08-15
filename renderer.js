(() => {
  "use strict";

  const files = [
    "js/state.js",
    "js/shapes.js",
    "js/edges.js",
    "js/canvas.js",
    "js/interactions.js",
    "js/sidebar.js",
    "js/toolbar.js",
    "js/export.js",
    "js/app.js"
  ];

  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`${src} yüklenemedi`));
    document.body.appendChild(script);
  });

  (async () => {
    for (const file of files) await load(file);
  })().catch((error) => {
    console.error(error);
    window.alert(`Akış Studio başlatılamadı: ${error.message}`);
  });
})();