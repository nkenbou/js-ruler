(function () {
  window.addEventListener('load', function () {
    document.getElementById('zoom').addEventListener('change', function () {
      Ruler.zoom(parseFloat(this.value));
    });

    Ruler.ruler($('#workarea'), {
      unit: 'px',
      zoom: 1
    });
    Ruler.update(1);
  });
}());
