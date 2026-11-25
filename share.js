/* GSST share bars: shares the page link only, never anything a visitor entered. */
(function () {
  var canon = document.querySelector('link[rel="canonical"]');
  var url = canon ? canon.href : location.href.split('#')[0];
  document.querySelectorAll('.share').forEach(function (bar) {
    var text = bar.getAttribute('data-text') || document.title;
    var enc = encodeURIComponent, links = {
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url),
      whatsapp: 'https://wa.me/?text=' + enc(text + ' ' + url),
      email: 'mailto:?subject=' + enc(text) + '&body=' + enc(text + '\n\n' + url)
    };
    bar.querySelectorAll('[data-net]').forEach(function (a) { a.href = links[a.getAttribute('data-net')]; });
    var nat = bar.querySelector('.share-native');
    if (nat && navigator.share) {
      nat.hidden = false;
      nat.addEventListener('click', function () { navigator.share({ title: text, text: text, url: url }).catch(function () {}); });
    }
    var copy = bar.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Link copied'; setTimeout(function () { copy.textContent = 'Copy link'; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
      else prompt('Copy this link:', url);
    });
  });
})();
