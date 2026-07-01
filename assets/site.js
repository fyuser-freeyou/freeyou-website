// FreeYou — shared site behaviour
document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // Newsletter / form demo handlers (no backend)
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('[data-msg]');
      if (msg) { msg.style.display = 'block'; }
      f.reset();
    });
  });

  // Active TOC highlight on scroll (article pages)
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length) {
    var sections = Array.from(tocLinks).map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);
    window.addEventListener('scroll', function () {
      var pos = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (s) { if (s.offsetTop <= pos) current = s; });
      tocLinks.forEach(function (a) {
        a.style.color = a.getAttribute('href') === '#' + (current && current.id) ? 'var(--brand)' : '';
        a.style.borderColor = a.getAttribute('href') === '#' + (current && current.id) ? 'var(--brand)' : 'transparent';
      });
    });
  }
});
