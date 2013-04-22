;(function(win, doc) {
  "use strict";
  var requestAnimFrame = (function() {
    return win.requestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame ||
      win.oRequestAnimationFrame ||
      win.msRequestAnimationFrame ||
      function(callback, fps) {
         return win.setTimeout(callback, 1000/60);
       };
  })();

  var Canvas = function(id, fps, loopFunction) {
    this.element = doc.getElementById(id);
    this.context = this.element.getContext('2d');
    this.fps = fps;

    // for counting fps rate:
    this.currentFps = 0;
    this._countingFps = 0;
    this._lastFpsTime = 0;

    this.loopFunction = loopFunction;
    this.firstFrame = true;
    this.frameNumber = 0;
    this.startTime = new Date();
    this.lastTime = new Date();
    //Object.extend(this, this.context);
    Object.extend(this, this.context.prototype);
    this._loop();
  };

  Canvas.prototype = {
    renderToCanvas: function(width, height, callback) {
      var element = doc.createElement('canvas'),
          ctx     = element.getContext('2d');
      element.width = width;
      element.height = height;
      callback(ctx);
      return element;
    },

    clear: function() {
      this.context.clearRect(0, 0, this.element.clientWidth, this.element.clientHeight);
    },

    drawImage: function(img, x, y, align, rotation) {
      var width = img.width,
          height = img.height,
          aligned = align.split('-'),
          offsetX = 0,
          offsetY = 0;
      // calculate aligned offset
      if (aligned[0] == 'center') {
        offsetX = width/2;
      } else if (aligned[0] == 'right') {
        offsetX = width;
      }
      if (aligned[1] == 'middle') {
        offsetY = height/2;
      } else if (aligned[1] == 'bottom') {
        offsetY = height;
      }
      this.context.save();
      this.context.translate(x, y);
      this.context.rotate(this.deg2rad(rotation));
      this.context.drawImage(img, -offsetX, -offsetY);
      this.context.restore();
    },

    _loop: function() {
      var self = this,
          now  = new Date(),
          frameDuration = now - this.lastTime,
          totalDuration = now - this.startTime;
      this.loopFunction(this.context, frameDuration, totalDuration, ++this.frameNumber);
      this.firstFrame = false;
      this.lastTime = now;
      if (this.fps) {
        ++this._countingFps;
        if (this._lastFpsTime < now - 1000) {
          this.currentFps = this._countingFps;
          this._countingFps = 0;
          this._lastFpsTime = now;
        }
        requestAnimFrame(function() {
          self._loop();
        }, 1000 / this.fps);
      }
    },

    rad2deg: function(rad) {
      return rad * (180 / Math.PI);
    },

    deg2rad: function(deg) {
      return deg * (Math.PI / 180);
    }
  };

  Canvas.ALIGN = {
    LEFT : {
      TOP : 'left-top',
      MIDDLE : 'left-middle',
      BOTTOM : 'left-bottom'
    },
    CENTER : {
      TOP : 'center-top',
      MIDDLE : 'center-middle',
      BOTTOM : 'center-bottom'
    },
    RIGHT : {
      TOP : 'right-top',
      MIDDLE : 'right-middle',
      BOTTOM : 'right-bottom'
    }
  };


  win.Canvas = Canvas;
}(window, document));
