(function () {
  window.addEventListener('load', function () {
    document.getElementById('zoom').addEventListener('change', function () {
      zruler.zoom(parseFloat(this.value));
    });

    zruler.ruler($('#workarea'), {
      unit: 'px',
      zoom: 1
    });
    zruler.update(1);
  });
}());
