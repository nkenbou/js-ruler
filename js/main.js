(function () {

  var BASE_UNIT = 'px';

  var bigIntervals = [];
  var i;
  for (i = 0.1; i < 1E5; i *= 10) {
	bigIntervals.push(i);
	bigIntervals.push(2 * i);
	bigIntervals.push(5 * i);
  }

  function getZoom() {
    return 1;
  }

  function getTypeMap() {
    return {
      'px': 1
    };
  }

  function  getSVG() {
    return document.querySelector('#workarea svg');
  }

  function updateRulers(scanvas, zoom) {
    var d, i;
    var svg = getSVG();
    var units = getTypeMap();
    var unit = units[BASE_UNIT]; // 1 = 1px

    // draw x ruler then y ruler
    for (d = 0; d < 2; d++) {
      var isX = (d === 0);
      var dimensionType = isX ? 'x' : 'y';
      var lengthType = isX ? 'width' : 'height';
      var svgDimension = Number(svg.getAttribute(dimensionType));

      var $rulerCanvasOriginal = $('#ruler-' + dimensionType + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $rulerCanvas = $rulerCanvasOriginal.clone();
      $rulerCanvasOriginal.replaceWith($rulerCanvas);

      var rulerCanvas = $rulerCanvas[0];

      // Set the canvas size to the width of the container
      var rulerLength = scanvas[lengthType]();
      // rulerCanvas.parentNode.style[lengthType] = rulerLength + 'px'; // nkenbou
      var context = rulerCanvas.getContext('2d');

      context.fillStyle = 'rgb(200,0,0)';
      context.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);

      rulerCanvas[lengthType] = rulerLength;

      var zoomedUnitPX = unit * zoom;

      // Calculate the main number interval
      var raw = 50 / zoomedUnitPX;
      var bigInterval = 1;
      for (i = 0; i < bigIntervals.length; i++) {
        bigInterval = bigIntervals[i];
        if (raw <= bigInterval) {
          break;
        }
      }

      var bigIntervalPX = bigInterval * zoomedUnitPX;

      context.font = '9px sans-serif';

      var rulerDelimiter = ((svgDimension / zoomedUnitPX) % bigInterval) * zoomedUnitPX;
      var labelPosition = rulerDelimiter - bigIntervalPX;
      // draw big intervals
      while (rulerDelimiter < rulerLength) {
        labelPosition += bigIntervalPX;

        var currentDelimiter = Math.round(rulerDelimiter) + 0.5;
        if (isX) {
          context.moveTo(currentDelimiter, 15);
          context.lineTo(currentDelimiter, 0);
        }
        else {
          context.moveTo(15, currentDelimiter);
          context.lineTo(0, currentDelimiter);
        }

        var label = (labelPosition - svgDimension) / zoomedUnitPX;
        if (bigInterval >= 1) {
          label = Math.round(label);
        } else {
          var decs = String(bigInterval).split('.')[1].length;
          label = label.toFixed(decs);
        }

        // Change 1000s to Ks
        if (label !== 0 && label !== 1000 && label % 1000 === 0) {
          label = (label / 1000) + 'K';
        }

        if (isX) {
          context.fillText(label, rulerDelimiter+2, 8);
        } else {
          // draw label vertically
          var str = String(label).split('');
          for (i = 0; i < str.length; i++) {
            context.fillText(str[i], 1, (rulerDelimiter+9) + i*9);
          }
        }

        var part = bigIntervalPX / 10;
        // draw the small intervals
        for (i = 1; i < 10; i++) {
          var subDelimiter = Math.round(rulerDelimiter + part * i) + 0.5;

          // odd lines are slighly longer
          var lineNumber = (i % 2) ? 12 : 10;
          if (isX) {
            context.moveTo(subDelimiter, 15);
            context.lineTo(subDelimiter, lineNumber);
          } else {
            context.moveTo(15, subDelimiter);
            context.lineTo(lineNumber, subDelimiter);
          }
        }
        rulerDelimiter += bigIntervalPX;
      }
      context.strokeStyle = '#000';
      context.stroke();
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

    updateRulers($('#workarea > .canvas'), getZoom());
  });
}());
