(function () {

  var BASE_UNIT = 'px';

  var r_intervals = [];
  var i;
  for (i = 0.1; i < 1E5; i *= 10) {
	r_intervals.push(i);
	r_intervals.push(2 * i);
	r_intervals.push(5 * i);
  }

  function getZoom() {
    return 1;
  }

  function getTypeMap() {
    return {
      'px': 1
    };
  }

  function  getContentElem() {
    return document.querySelector('#workarea svg');
  }

  function updateRulers(scanvas, zoom) {
    if (!zoom) {zoom = getZoom();}
    if (!scanvas) {scanvas = $('#workarea > .canvas');}

    var d, i;
    var contentElem = getContentElem();
    var units = getTypeMap();
    var unit = units[BASE_UNIT]; // 1 = 1px

    // draw x ruler then y ruler
    for (d = 0; d < 2; d++) {
      var isX = (d === 0);
      var dim = isX ? 'x' : 'y';
      var lentype = isX ? 'width' : 'height';
      var contentDim = Number(contentElem.getAttribute(dim));

      var $hcanv_orig = $('#ruler-' + dim + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $hcanv = $hcanv_orig.clone();
      $hcanv_orig.replaceWith($hcanv);

      var hcanv = $hcanv[0];

      // Set the canvas size to the width of the container
      var ruler_len = scanvas[lentype]();
      // hcanv.parentNode.style[lentype] = ruler_len + 'px'; // nkenbou
      var ctx_num = 0;
      var ctx = hcanv.getContext('2d');
      var num;

      ctx.fillStyle = 'rgb(200,0,0)';
      ctx.fillRect(0, 0, hcanv.width, hcanv.height);

      hcanv[lentype] = ruler_len;

      var u_multi = unit * zoom;

      // Calculate the main number interval
      var raw_m = 50 / u_multi;
      var multi = 1;
      for (i = 0; i < r_intervals.length; i++) {
        num = r_intervals[i];
        multi = num;
        if (raw_m <= num) {
          break;
        }
      }

      var big_int = multi * u_multi;

      ctx.font = '9px sans-serif';

      var ruler_d = ((contentDim / u_multi) % multi) * u_multi;
      var label_pos = ruler_d - big_int;
      // draw big intervals
      while (ruler_d < ruler_len) {
        label_pos += big_int;
        // var real_d = ruler_d - contentDim; // Currently unused

        var cur_d = Math.round(ruler_d) + 0.5;
        if (isX) {
          ctx.moveTo(cur_d, 15);
          ctx.lineTo(cur_d, 0);
        }
        else {
          ctx.moveTo(15, cur_d);
          ctx.lineTo(0, cur_d);
        }

        num = (label_pos - contentDim) / u_multi;
        var label;
        if (multi >= 1) {
          label = Math.round(num);
        }
        else {
          var decs = String(multi).split('.')[1].length;
          label = num.toFixed(decs);
        }

        // Change 1000s to Ks
        if (label !== 0 && label !== 1000 && label % 1000 === 0) {
          label = (label / 1000) + 'K';
        }

        if (isX) {
          ctx.fillText(label, ruler_d+2, 8);
        } else {
          // draw label vertically
          var str = String(label).split('');
          for (i = 0; i < str.length; i++) {
            ctx.fillText(str[i], 1, (ruler_d+9) + i*9);
          }
        }

        var part = big_int / 10;
        // draw the small intervals
        for (i = 1; i < 10; i++) {
          var sub_d = Math.round(ruler_d + part * i) + 0.5;

          // odd lines are slighly longer
          var line_num = (i % 2) ? 12 : 10;
          if (isX) {
            ctx.moveTo(sub_d, 15);
            ctx.lineTo(sub_d, line_num);
          } else {
            ctx.moveTo(15, sub_d);
            ctx.lineTo(line_num, sub_d);
          }
        }
        ruler_d += big_int;
      }
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
  }

  window.addEventListener('load', function () {
    var workarea = document.getElementById('workarea');
    var canvas = workarea.querySelector('.canvas');
    var rulerX = workarea.querySelector('.ruler-x');
    var rulerY = workarea.querySelector('.ruler-y');
    var rulerCorner = workarea.querySelector('.ruler-corner');

    var zoom = document.getElementById('zoom').value = 1;

    document.getElementById('zoom').addEventListener('change', function () {
      var cz = parseFloat(this.value) / zoom;

      zoom = parseFloat(this.value);
      canvas.style.zoom = zoom;
      rulerX.style.zoom = 1 / zoom;
      rulerY.style.zoom = 1 / zoom;
      rulerCorner.style.zoom =  1 / zoom;

      workarea.scrollTop = workarea.scrollTop * cz;
      workarea.scrollLeft = workarea.scrollLeft * cz;

      $('#workarea svg').css({
        left: parseFloat($('#workarea svg').css('left')) / cz + 'px',
        top: parseFloat($('#workarea svg').css('top')) / cz + 'px'
      });

      updateRulers($('#workarea > .canvas'), zoom);
    });

    workarea.addEventListener('scroll', function (event) {
      rulerX.style.top = workarea.scrollTop / zoom + 'px';
      rulerY.style.left = workarea.scrollLeft / zoom + 'px';
      rulerCorner.style.left = workarea.scrollLeft / zoom + 'px';
      rulerCorner.style.top = workarea.scrollTop / zoom + 'px';
    });

    updateRulers($('#workarea > .canvas'), 1);
  });
}());
