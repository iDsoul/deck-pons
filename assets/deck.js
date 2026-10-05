(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var dots = document.querySelector('.nav .dots');
  var count = document.querySelector('.nav .count');
  var bar = document.querySelector('.progress');
  var cur = -1, hideTimer;

  function fit() {
    var s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = 'translate(' + ((innerWidth - 1920 * s) / 2) + 'px,' + ((innerHeight - 1080 * s) / 2) + 'px) scale(' + s + ')';
  }

  slides.forEach(function (_, i) {
    var d = document.createElement('i');
    d.title = 'Slide ' + (i + 1);
    d.addEventListener('click', function () { go(i); });
    dots.appendChild(d);
  });

  var st = 0, maxSt = 0;
  function steps(el) { return Array.prototype.slice.call(el.querySelectorAll('.stp')); }
  function restart(root) {
    var nodes = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    nodes.forEach(function (n) { if (n.style) n.style.animationName = 'none'; });
    void document.body.offsetWidth;            // força o recálculo de estilo (offsetWidth não existe em elementos SVG)
    nodes.forEach(function (n) { if (n.style) n.style.animationName = ''; });
  }
  function setStep(k, animate) {
    steps(slides[cur]).forEach(function (el) {
      var s = +el.getAttribute('data-step'), was = el.classList.contains('rev');
      el.classList.toggle('rev', s <= k);
      if (animate && s <= k && !was) restart(el);
    });
    st = k;
  }
  function next() { if (maxSt && st < maxSt) setStep(st + 1, true); else go(cur + 1); }
  function prev() { if (maxSt && st > 0) setStep(st - 1, false); else go(cur - 1, true); }
  function go(n, back) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    var prev = slides[cur];
    if (prev) {
      prev.classList.remove('on'); prev.classList.add('leaving');
      setTimeout(function () { prev.classList.remove('leaving'); }, 700);
    }
    cur = n;
    var el = slides[cur];
    el.classList.remove('leaving');
    void el.offsetWidth;            // reinicia as animações do slide
    el.classList.add('on');
    Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === cur); });
    count.textContent = (cur + 1) + ' / ' + slides.length;
    bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    var ss = steps(el); maxSt = ss.length ? Math.max.apply(null, ss.map(function (e) { return +e.getAttribute('data-step'); })) : 0;
    if (maxSt) setStep(back ? maxSt : 0, false); else st = 0;
    history.replaceState(null, '', '#' + (cur + 1));
  }

  function wake() {
    document.body.classList.add('ui');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { document.body.classList.remove('ui'); }, 2600);
  }

  document.querySelector('.nav .prev').addEventListener('click', function () { prev(); });
  document.querySelector('.nav .next').addEventListener('click', function () { next(); });
  addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
    }
    wake();
  });
  addEventListener('mousemove', wake);
  var tx = null;
  addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; wake(); }, { passive: true });
  addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
  });
  addEventListener('resize', fit);

  // Ajusta cada bloco .tx à largura e à posição medidas no slide original.
  function fitText() {
    Array.prototype.forEach.call(stage.querySelectorAll('.tx'), function (el) {
      var W = parseFloat(el.dataset.w), fest = parseFloat(el.dataset.fest), r = parseFloat(el.dataset.r);
      var pitch = parseFloat(el.dataset.pitch), top = parseFloat(el.dataset.top), x = parseFloat(el.dataset.x);
      el.style.visibility = 'hidden'; el.style.left = '0px'; el.style.top = '0px'; el.style.width = 'auto';
      el.style.fontSize = fest + 'px';
      var measured = el.getBoundingClientRect().width / currentScale;
      var f = el.dataset.fixed ? fest : Math.min(fest * 1.12, fest * W / measured);
      el.style.fontSize = f + 'px';
      var lh = pitch > 0 ? pitch : 1.35 * f;
      el.style.lineHeight = lh + 'px';
      var baseline = (lh - 1.362 * f) / 2 + 1.069 * f;          // linha de base dentro da caixa de linha
      el.style.top = (top - (baseline - r * f)) + 'px';
      if (el.classList.contains('c')) { el.style.left = x + 'px'; el.style.width = W + 'px'; }
      else el.style.left = x + 'px';
      el.style.visibility = '';
    });
    document.body.classList.add('fitted');
  }

  var currentScale = 1;
  var _fit = fit;
  fit = function () { _fit(); currentScale = Math.min(innerWidth / 1920, innerHeight / 1080); };
  fit();
  var faces = ['400 20px "Open Sans"', 'italic 400 20px "Open Sans"', '600 20px "Open Sans"', '700 20px "Open Sans"'];
  Promise.all(faces.map(function (f) { return document.fonts.load(f); })).then(function () {
    fitText();
    var start = parseInt((location.hash || '').slice(1), 10);
    go(isNaN(start) ? 0 : start - 1);
    wake();
  });
})();
