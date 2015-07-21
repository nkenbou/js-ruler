(function (global) {

  var CLASS_PREFIX = 'zruler-';
  var WORKAREA_CLASS = CLASS_PREFIX + 'workarea';
  var X_CLASS = CLASS_PREFIX + 'x';
  var Y_CLASS = CLASS_PREFIX + 'y';
  var CORNER_CLASS = CLASS_PREFIX + 'corner';
  var CONTENT_WRAPPER_CLASS = CLASS_PREFIX + 'content-wrapper';

  var unitPX = {
    'px': 1
  };

  var zruler = {
    root: null,
    content: null,
    unit: 'px',
    zoomValue: 1,

    ruler: function (root, option) {
      this.root = root;

      this.content = root.children();
      var template =
            '<div class="' + WORKAREA_CLASS + '">' +
            '<div class="' + X_CLASS  + '">' +
            '<canvas height="15"></canvas>' +
            '</div>' +
            '<div class="' + Y_CLASS  + '">' +
            '<canvas width="15"></canvas>' +
            '</div>' +
            '<div class="' + CORNER_CLASS  + '"></div>' +
            '<div class="' + CONTENT_WRAPPER_CLASS  + '">' +
            '</div>' +
            '</div>';
      root.html(template);
      root.find('.' + CONTENT_WRAPPER_CLASS).append(this.content);

      if (option.unit) {
        this.unit = option.unit;
      }
      if (option.zoom) {
        this.zoomValue = option.zoom;
      }

      root.on('scroll', function (event) {
        root.find('.' + X_CLASS).css('top', root.scrollTop() + 'px');
        root.find('.' + Y_CLASS).css('left', root.scrollLeft() + 'px');
        root.find('.' + CORNER_CLASS).css({
          left: root.scrollLeft() + 'px',
          top: root.scrollTop() + 'px'
        });
      });
    },

    zoom: function (zoom) {
      var cz = zoom / this.zoomValue;

      this.update(zoom);

      this.root.scrollTop(this.root.scrollTop() * cz);
      this.root.scrollLeft(this.root.scrollLeft() * cz);
    },

    update: function (zoom) {
      this.zoomValue = zoom;
      this.content.css('zoom', zoom);

      var svgWidth = this.content.width() * zoom;
      var width = svgWidth * 3;
      if (width < 1864) {
        width = 1864;
      }
      var svgHeight = this.content.height() * zoom;
      var height = svgHeight * 3;
      if (height < 1500) {
        height: 1500;
      }

      this.root.children('.' + WORKAREA_CLASS).css({
        width: width + 'px',
        height: height + 'px',
      });
      this.root.find('.' + CONTENT_WRAPPER_CLASS).css({
        left: width / 2 - svgWidth / 2 + 'px',
        top: height / 2 - svgHeight / 2 + 'px'
      });

      rulerX.update(zoom);
      rulerY.update(zoom);
    },

    getUnitPX: function () {
      // 1 = 1px
      return unitPX[this.unit];
    },

    getSvgDimension:  function (positionType) {
      return Number(this.root.find('.' + CONTENT_WRAPPER_CLASS).position()[positionType]);
    },

    getRulerLength: function (lengthType) {
      return this.root.children('.' + WORKAREA_CLASS)[lengthType]();
    }
  };

  var Ruler = {
    context: null,

    getBigIntervals: function () {
      var bigIntervals = [];
      for (var i = 0.1; i < 1E5; i *= 10) {
	    bigIntervals.push(i);
	    bigIntervals.push(2 * i);
	    bigIntervals.push(5 * i);
      }
      return bigIntervals;
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    },

    initialize: function () {
      var $rulerCanvasOriginal = zruler.root.find('.' + CLASS_PREFIX + this.dimensionType + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $rulerCanvas = $rulerCanvasOriginal.clone();
      $rulerCanvasOriginal.replaceWith($rulerCanvas);

      var rulerCanvas = $rulerCanvas[0];

      // Set the canvas size to the width of the container
      var rulerLength = zruler.getRulerLength(this.lengthType);
      this.context = rulerCanvas.getContext('2d');

      this.context.fillStyle = 'rgb(200,0,0)';
      this.context.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);
      this.context.font = '9px sans-serif';

      rulerCanvas[this.lengthType] = rulerLength;
    },

    getRulerLength: function (lengthType) {
      return this.root.children('.' + WORKAREA_CLASS)[lengthType]();
    }
  };

  var Ruler = {
    context: null,

    getBigIntervals: function () {
      var bigIntervals = [];
      for (var i = 0.1; i < 1E5; i *= 10) {
	    bigIntervals.push(i);
	    bigIntervals.push(2 * i);
	    bigIntervals.push(5 * i);
      }
      return bigIntervals;
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    },

    initialize: function () {
      var $rulerCanvasOriginal = zruler.root.find('.' + CLASS_PREFIX + this.dimensionType + ' canvas:first');

      // Bit of a hack to fully clear the canvas in Safari & IE9
      var $rulerCanvas = $rulerCanvasOriginal.clone();
      $rulerCanvasOriginal.replaceWith($rulerCanvas);

      var rulerCanvas = $rulerCanvas[0];

      // Set the canvas size to the width of the container
      var rulerLength = zruler.getRulerLength(this.lengthType);
      this.context = rulerCanvas.getContext('2d');

      this.context.fillStyle = 'rgb(200,0,0)';
      this.context.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);
      this.context.font = '9px sans-serif';

      rulerCanvas[this.lengthType] = rulerLength;
    },

    update: function (zoom) {
      var i;
      var unitPX = zruler.getUnitPX();
      var zoomedUnitPX = unitPX * zoom;

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

      var rulerDelimiter = ((zruler.getSvgDimension(this.positionType) / zoomedUnitPX) % bigInterval) * zoomedUnitPX;
      var labelPosition = rulerDelimiter - bigIntervalPX;
      // draw big intervals
      while (rulerDelimiter < zruler.getRulerLength(this.lengthType)) {
        labelPosition += bigIntervalPX;

        var currentDelimiter = Math.round(rulerDelimiter) + 0.5;
        this.contextDrawDelimiter(currentDelimiter);

        var label = (labelPosition - zruler.getSvgDimension(this.positionType)) / zoomedUnitPX;
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
    positionType: 'left',
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
    positionType: 'top',
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

  global.zruler = zruler;
}(window));
