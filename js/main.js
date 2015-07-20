(function () {

  var Ruler = {
    root: null,
    canvas: null,
    context: null,
    unit: 'px',
    zoomValue: 1,

    ruler: function (root, option) {
      this.root = rulerX.root = rulerY.root = root;
      this.canvas = rulerX.canvas = rulerY.canvas = root.children('.canvas');
      if (option.unit) {
        rulerX.unit = rulerY.unit = option.unit;
      }
      if (option.zoom) {
        this.zoomValue = rulerX.zoomValue = rulerY.zoomValue = option.zoom;
      }

      root.on('scroll', function (event) {
        root.find('.ruler-x').css('top', root.scrollTop() + 'px');
        root.find('.ruler-y').css('left', root.scrollLeft() + 'px');
        root.find('.ruler-corner').css({
          left: root.scrollLeft() + 'px',
          top: root.scrollTop() + 'px'
        });
      });
    },

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

    getUnits: function () {
      return {
        'px': 1
      };
    },

    getBigIntervals: function () {
      var bigIntervals = [];
      for (var i = 0.1; i < 1E5; i *= 10) {
	    bigIntervals.push(i);
	    bigIntervals.push(2 * i);
	    bigIntervals.push(5 * i);
      }
      return bigIntervals;
    },

    getSvgDimension:  function () {
      return Number(this.root.find('svg')[0].getAttribute(this.dimensionType));
    },

    getRulerLength: function () {
      return this.canvas[this.lengthType]();
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    },

    zoom: function (zoom) {
      var cz = zoom / this.zoomValue;

      this.zoomValue = rulerX.zoomValue = rulerY.zoomValue = zoom;
      this.canvas.css('zoom', zoom);
      this.root.find('.ruler-x').css('zoom', 1 / zoom);
      this.root.find('.ruler-y').css('zoom', 1 / zoom);
      this.root.find('.ruler-corner').css('zoom', 1 / zoom);

      this.root.scrollTop(this.root.scrollTop() *  cz);
      this.root.scrollLeft(this.root.scrollLeft() * cz);

      var svg = this.root.find('svg');
      svg.css({
        left: parseFloat(svg.css('left')) / cz + 'px',
        top: parseFloat(svg.css('top')) / cz + 'px'
      });

      this.update(zoom);
    },

    update: function (zoom) {
      this._update.call(rulerX, zoom);
      this._update.call(rulerY, zoom);
    },

    _update: function (zoom) {
      var i;
      var units = this.getUnits();
      var unit = units[this.unit]; // 1 = 1px
      var zoomedUnitPX = unit * zoom;

      // Calculate the main number interval
      var raw = 50 / zoomedUnitPX;
      var bigInterval = 1;
      var bigIntervals = this.getBigIntervals();
      for (i = 0; i < bigIntervals.length; i++) {
        bigInterval = bigIntervals[i];
        if (raw <= bigInterval) {
          break;
        }
      }

      var bigIntervalPX = bigInterval * zoomedUnitPX;

      this.initialize();

      var rulerDelimiter = ((this.getSvgDimension() / zoomedUnitPX) % bigInterval) * zoomedUnitPX;
      var labelPosition = rulerDelimiter - bigIntervalPX;
      // draw big intervals
      while (rulerDelimiter < this.getRulerLength()) {
        labelPosition += bigIntervalPX;

        var currentDelimiter = Math.round(rulerDelimiter) + 0.5;
        this.contextDrawDelimiter(currentDelimiter);

        var label = (labelPosition - this.getSvgDimension()) / zoomedUnitPX;
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

        this.contextDrawLabel(label, rulerDelimiter);

        var part = bigIntervalPX / 10;
        // draw the small intervals
        for (i = 1; i < 10; i++) {
          var subDelimiter = Math.round(rulerDelimiter + part * i) + 0.5;

          // odd lines are slighly longer
          var lineNumber = (i % 2) ? 12 : 10;
          this.contextDrawSubDelimiter(subDelimiter, lineNumber);
        }
        rulerDelimiter += bigIntervalPX;
      }

      this.contextStroke();
    }
  };

  var rulerX = {
    dimensionType: 'x',
    lengthType: 'width',

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
    }
  };

  var rulerY = {
    dimensionType: 'y',
    lengthType: 'height',

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
    }
  };

  $.extend(true, rulerX, Ruler);
  $.extend(true, rulerY, Ruler);

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
