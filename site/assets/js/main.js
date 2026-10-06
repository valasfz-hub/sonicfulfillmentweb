(function () {
  // Google Analytics: paste the Measurement ID (G-XXXXXXXXXX) here to turn tracking on.
  var GA_ID = '';
  if (GA_ID) {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile menu
  var nav = document.querySelector('.nav');
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Services carousel
  var track = document.getElementById('track');
  var prev = document.querySelector('.arrow.prev');
  var next = document.querySelector('.arrow.next');
  if (track && prev && next) {
    function step() {
      var card = track.querySelector('.card');
      return card.getBoundingClientRect().width + 24;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Dashboard preview tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.demo-tabs [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var next = tabs[(i + d + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  // Quote form. /api/quote is the Firebase function that saves the lead and sends the emails (see firebase.json).
  function sendQuote(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    return fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) { if (!res.ok) throw new Error('send failed'); });
  }
  var form = document.getElementById('quote-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    [['f-name', function (v) { return v.trim().length > 0; }],
     ['f-email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }]
    ].forEach(function (pair) {
      var input = document.getElementById(pair[0]);
      var valid = pair[1](input.value);
      input.parentElement.classList.toggle('invalid', !valid);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid && ok) { input.focus(); ok = false; }
    });
    if (!ok) return;
    var button = form.querySelector('button[type="submit"]');
    var error = document.getElementById('form-error');
    button.disabled = true;
    error.hidden = true;
    sendQuote(form)
      .then(function () {
        document.getElementById('sent-email').textContent = document.getElementById('f-email').value.trim();
        form.classList.add('is-sent');
        if (window.gtag) window.gtag('event', 'generate_lead');
      })
      .catch(function () {
        error.hidden = false;
        button.disabled = false;
      });
  });
})();
