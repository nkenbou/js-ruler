(function (global) {

  var CLASS_PREFIX = 'zruler-';
  var WORKAREA_CLASS = CLASS_PREFIX + 'workarea';
  var X_CLASS = CLASS_PREFIX + 'x';
  var Y_CLASS = CLASS_PREFIX + 'y';
  var CORNER_CLASS = CLASS_PREFIX + 'corner';
  var CONTENT_WRAPPER_CLASS = CLASS_PREFIX + 'content-wrapper';

  var MIN_WIDTH = 1864;
  var MIN_HEIGHT = 1500;

  var unitPX = {
    'px': 1
  };

  var BIG_INTERVALS = [];
  for (var i = 0.1; i < 1E5; i *= 10) {
	BIG_INTERVALS.push(i);
	BIG_INTERVALS.push(2 * i);
	BIG_INTERVALS.push(5 * i);
  }

  function calculateDelimiterPoint(delimiterPoint) {
    return Math.round(delimiterPoint) + 0.5;
  }

  function calculateSubDelimiterPoint(delimiterPoint, intervalPX, index) {
    var subDelimiterPart = intervalPX / 10;
    return Math.round(delimiterPoint + subDelimiterPart * index) + 0.5
  }

  function calculateSubDelimiterLengthPoint(index) {
    return (index % 2) ? 12 : 10;
  }

  var zruler = {
    $root: null,
    $content: null,
    unit: 'px',
    zoomValue: 1,

    ruler: function ($root, option) {
      this.$root = $root;

      this.$content = $root.children();
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
      $root.html(template);
      $root.find('.' + CONTENT_WRAPPER_CLASS).append(this.$content);

      if (option.unit) {
        this.unit = option.unit;
      }
      if (option.zoom) {
        this.zoomValue = option.zoom;
      }

      $root.on('scroll', function (event) {
        $root.find('.' + X_CLASS).css('top', $root.scrollTop() + 'px');
        $root.find('.' + Y_CLASS).css('left', $root.scrollLeft() + 'px');
        $root.find('.' + CORNER_CLASS).css({
          left: $root.scrollLeft() + 'px',
          top: $root.scrollTop() + 'px'
        });
      });

      this.update(1);
    },

    zoom: function (zoom) {
      var cz = zoom / this.zoomValue;

      this.update(zoom);

      this.$root.scrollTop(this.$root.scrollTop() * cz);
      this.$root.scrollLeft(this.$root.scrollLeft() * cz);
    },

    update: function (zoom) {
      this.zoomValue = zoom;
      this.$content.css('zoom', zoom);

      var contentWidth = this.$content.width() * zoom;
      var width = contentWidth * 3;
      if (width < MIN_WIDTH) {
        width = MIN_WIDTH;
      }
      var contentHeight = this.$content.height() * zoom;
      var height = contentHeight * 3;
      if (height < MIN_HEIGHT) {
        height: MIN_HEIGHT;
      }

      this.$root.children('.' + WORKAREA_CLASS).css({
        width: width + 'px',
        height: height + 'px',
      });
      this.$root.find('.' + CONTENT_WRAPPER_CLASS).css({
        left: width / 2 - contentWidth / 2 + 'px',
        top: height / 2 - contentHeight / 2 + 'px'
      });

      rulerX.update(zoom);
      rulerY.update(zoom);
    },

    getZoomedUnitPX: function () {
      return unitPX[this.unit] * this.zoomValue;
    },

    getBigInterval: function () {
      // Calculate the main number interval
      var raw = 50 / this.getZoomedUnitPX();
      var bigInterval = 1;
      for (var i = 0; i < BIG_INTERVALS.length; i++) {
        bigInterval = BIG_INTERVALS[i];
        if (raw <= bigInterval) {
          break;
        }
      }
      return bigInterval;
    },

    getBigIntervalPX: function () {
      return this.getBigInterval() * this.getZoomedUnitPX();
    },

    getContentPosition:  function (positionType) {
      return Number(this.$root.find('.' + CONTENT_WRAPPER_CLASS).position()[positionType]);
    },

    getRulerLength: function (lengthType) {
      return this.$root.children('.' + WORKAREA_CLASS)[lengthType]();
    }
  };

  var Ruler = {
    context: null,

    calculateLabel: function (delimiterPoint) {
      var bigInterval = zruler.getBigInterval();
      var label = (delimiterPoint - zruler.getContentPosition(this.positionType)) / zruler.getZoomedUnitPX();

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

      return label;
    },

    contextStroke: function () {
      this.context.strokeStyle = '#000';
      this.context.stroke();
    },

    update: function (zoom) {
      this.initialize();

      var zoomedUnitPX = zruler.getZoomedUnitPX();
      var bigInterval = zruler.getBigInterval();
      var bigIntervalPX = zruler.getBigIntervalPX();
      var delimiterPoint = ((zruler.getContentPosition(this.positionType) / zoomedUnitPX) % bigInterval) * zoomedUnitPX;

      // draw big intervals
      while (delimiterPoint < zruler.getRulerLength(this.lengthType)) {
        this.drawDelimiter(delimiterPoint);
        this.drawLabel(delimiterPoint);

        // draw the small intervals
        for (var i = 1; i < 10; i++) {
          this.drawSubDelimiter(delimiterPoint, i);
        }

        delimiterPoint += bigIntervalPX;
      }

      this.contextStroke();
    },

    initialize: function () {
      var $rulerCanvasOriginal = zruler.$root.find('.' + CLASS_PREFIX + this.dimensionType + ' canvas:first');

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
    }
  };

  var rulerX = {
    positionType: 'left',
    dimensionType: 'x',
    lengthType: 'width',

    drawDelimiter: function (delimiterPoint) {
      var x = calculateDelimiterPoint(delimiterPoint);
      this.context.moveTo(x, 15);
      this.context.lineTo(x, 0);
    },

    drawLabel: function (delimiterPoint) {
      var label = this.calculateLabel(delimiterPoint);
      this.context.fillText(label, delimiterPoint + 2, 8);
    },

    drawSubDelimiter: function (delimiterPoint, index) {
      var x = calculateSubDelimiterPoint(delimiterPoint, zruler.getBigIntervalPX(), index);
      var toY = calculateSubDelimiterLengthPoint(index);
      this.context.moveTo(x, 15);
      this.context.lineTo(x, toY);
    }
  };

  var rulerY = {
    positionType: 'top',
    dimensionType: 'y',
    lengthType: 'height',

    drawDelimiter: function (delimiterPoint) {
      var y = calculateDelimiterPoint(delimiterPoint);
      this.context.moveTo(15, y);
      this.context.lineTo(0, y);
    },

    drawLabel: function (delimiterPoint) {
      var label = this.calculateLabel(delimiterPoint);
      // draw label vertically
      var str = String(label).split('');
      for (var i = 0; i < str.length; i++) {
        this.context.fillText(str[i], 1, delimiterPoint + 9 * (i + 1));
      }
    },

    drawSubDelimiter: function (delimiterPoint, index) {
      var y = calculateSubDelimiterPoint(delimiterPoint, zruler.getBigIntervalPX(), index);
      var toX = calculateSubDelimiterLengthPoint(index);
      this.context.moveTo(15, y);
      this.context.lineTo(toX, y);
    }
  };

  $.extend(true, rulerX, Ruler);
  $.extend(true, rulerY, Ruler);

  global.zruler = zruler;
}(window));
