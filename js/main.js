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

  var rulerX = {
    scanvas: null,
    context: null,
    dimensionType: 'x',
    lengthType: 'width',

    initialize: function () {
      var $rulerCanvasOriginal = $('#ruler-' + this.dimensionType + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $rulerCanvas = $rulerCanvasOriginal.clone();
      $rulerCanvasOriginal.replaceWith($rulerCanvas);

      var rulerCanvas = $rulerCanvas[0];

      // Set the canvas size to the width of the container
      var rulerLength = this.getRulerLength();
      // rulerCanvas.parentNode.style[this.lengthType] = rulerLength + 'px'; // nkenbou
      this.context = rulerCanvas.getContext('2d');

      this.context.fillStyle = 'rgb(200,0,0)';
      this.context.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);
      this.context.font = '9px sans-serif';

      rulerCanvas[this.lengthType] = rulerLength;
    },

    getSvgDimension:  function () {
      return Number(getSVG().getAttribute(this.dimensionType));
    },

    getRulerLength: function () {
      return this.scanvas[this.lengthType]();
    },

    contextDrawDelimiter: function (x) {
      this.context.moveTo(x, 15);
      this.context.lineTo(x, 0);
    },

    contextDrawLabel: function (label, rulerDelimiter) {
      this.context.fillText(label, rulerDelimiter+2, 8);
    },

    contextDrawSubDelimiter: function (x, lineNumber) {
      this.context.moveTo(x, 15);
      this.context.lineTo(x, lineNumber);
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    }
  };

  var rulerY = {
    scanvas: null,
    context: null,
    dimensionType: 'y',
    lengthType: 'height',

    initialize: function () {
      var $rulerCanvasOriginal = $('#ruler-' + this.dimensionType + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $rulerCanvas = $rulerCanvasOriginal.clone();
      $rulerCanvasOriginal.replaceWith($rulerCanvas);

      var rulerCanvas = $rulerCanvas[0];

      // Set the canvas size to the width of the container
      var rulerLength = this.getRulerLength();
      // rulerCanvas.parentNode.style[this.lengthType] = rulerLength + 'px'; // nkenbou
      this.context = rulerCanvas.getContext('2d');

      this.context.fillStyle = 'rgb(200,0,0)';
      this.context.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);
      this.context.font = '9px sans-serif';

      rulerCanvas[this.lengthType] = rulerLength;
    },

    getSvgDimension:  function () {
      return Number(getSVG().getAttribute(this.dimensionType));
    },

    getRulerLength: function () {
      return this.scanvas[this.lengthType]();
    },

    contextDrawDelimiter: function (y) {
      this.context.moveTo(15, y);
      this.context.lineTo(0, y);
    },

    contextDrawLabel: function (label, rulerDelimiter) {
      // draw label vertically
      var str = String(label).split('');
      for (i = 0; i < str.length; i++) {
        this.context.fillText(str[i], 1, (rulerDelimiter+9) + i*9);
      }
    },

    contextDrawSubDelimiter: function (y, lineNumber) {
      this.context.moveTo(15, y);
      this.context.lineTo(lineNumber, y);
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    }
  };

  function updateRuler(ruler, zoom) {
    var i;
    var units = getTypeMap();
    var unit = units[BASE_UNIT]; // 1 = 1px
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

    ruler.initialize();

    var rulerDelimiter = ((ruler.getSvgDimension() / zoomedUnitPX) % bigInterval) * zoomedUnitPX;
    var labelPosition = rulerDelimiter - bigIntervalPX;
    // draw big intervals
    while (rulerDelimiter < ruler.getRulerLength()) {
      labelPosition += bigIntervalPX;

      var currentDelimiter = Math.round(rulerDelimiter) + 0.5;
      ruler.contextDrawDelimiter(currentDelimiter);

      var label = (labelPosition - ruler.getSvgDimension()) / zoomedUnitPX;
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

      ruler.contextDrawLabel(label, rulerDelimiter);

      var part = bigIntervalPX / 10;
      // draw the small intervals
      for (i = 1; i < 10; i++) {
        var subDelimiter = Math.round(rulerDelimiter + part * i) + 0.5;

        // odd lines are slighly longer
        var lineNumber = (i % 2) ? 12 : 10;
        ruler.contextDrawSubDelimiter(subDelimiter, lineNumber);
      }
      rulerDelimiter += bigIntervalPX;
    }

    ruler.contextStroke();
  }

  window.addEventListener('load', function () {
    var workarea = document.getElementById('workarea');
    var canvas = workarea.querySelector('.canvas');
    var _rulerX = workarea.querySelector('.ruler-x');
    var _rulerY = workarea.querySelector('.ruler-y');
    var rulerCorner = workarea.querySelector('.ruler-corner');

    var zoom = document.getElementById('zoom').value = 1;

    document.getElementById('zoom').addEventListener('change', function () {
      var cz = parseFloat(this.value) / zoom;

      zoom = parseFloat(this.value);
      canvas.style.zoom = zoom;
      _rulerX.style.zoom = 1 / zoom;
      _rulerY.style.zoom = 1 / zoom;
      rulerCorner.style.zoom =  1 / zoom;

      workarea.scrollTop = workarea.scrollTop * cz;
      workarea.scrollLeft = workarea.scrollLeft * cz;

      $('#workarea svg').css({
        left: parseFloat($('#workarea svg').css('left')) / cz + 'px',
        top: parseFloat($('#workarea svg').css('top')) / cz + 'px'
      });

      updateRuler(rulerX, zoom);
      updateRuler(rulerY, zoom);
    });

    workarea.addEventListener('scroll', function (event) {
      _rulerX.style.top = workarea.scrollTop / zoom + 'px';
      _rulerY.style.left = workarea.scrollLeft / zoom + 'px';
      rulerCorner.style.left = workarea.scrollLeft / zoom + 'px';
      rulerCorner.style.top = workarea.scrollTop / zoom + 'px';
    });

    rulerX.scanvas = rulerY.scanvas = $('#workarea > .canvas');
    updateRuler(rulerX, getZoom());
    updateRuler(rulerY, getZoom());
  });
}());
