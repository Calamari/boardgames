
/*
 * Event handling for any object. Heavily inspired by Backbone.Events
 * https://github.com/documentcloud/backbone/
 * copied from xing codebase
 */
traits.EventEmitter = (function() {
  var slice = [].slice;

  /**
   * Observe an event
   *
   * @param {String} event
   * @param {Function} callback Callback method that gets triggered when event is fired
   *    It receives the event object and the data passed into the trigger method as arguments
   *
   * @example
   *    xing.observe("hello", function(event, userName) { ... });
   */
  function observe(event, callback) {
    var calls = this._callbacks || (this._callbacks = {});
    (calls[event] = calls[event] || []).push(callback);
    return this;
  }

  /**
   * Observe an event
   *
   * @param {String} event
   * @param {Function} callback Method that gets triggered when event is fired
   *    It receives the event object and the data passed into the trigger as arguments
   * @returns {Object} An Object upon you can call stop and start
   *
   * @example
   *    xing.on("hello", function(event, userName) { ... });
   */
  function on(event, callback) {
    this.observe(event, callback);
    return {
      stop: this.stopObserving.bind(this, event, callback)
    };
  }

  /**
   * Fire an event and pass all additional parameters into the callback.
   *
   *
   * @param {String} event
   * @param {*} Splat
   */
  function fire(event) {
    if (!this._callbacks) {
      return this;
    }

    var list = this._callbacks[event] || [],
      args = slice.call(arguments, 1),
      call;

    // Add an event object to the callback parameters
    args.unshift({
      type: event,
      eventName: event
    });

    // The fire loop invoking the callbacks
    for (var i = 0, l = list.length; i < l; i++) {
      if ((call = list[i])) {
        call.apply(this, args);
      } else {
        // Callback entry was null, i.e. it was remove beforehand.
        // Update the list to not include this entry.
        list.splice(i, 1);
        // Array before splice [cb1, cb2, cb3]
        // After splice at 1 [cb1, cb3]
        // This means we have to stay at index 1
        i--;
        // And we have to reduce the length
        l--;
      }
    }

    return this;
  }

  /**
   * Removes a callback
   *
   * @param {String} event
   * @param {Function} callback Exact reference to the handler,
   *    needed when you only want to remove one specific listener and not all
   */
  function stopObserving(event, callback) {
    var calls, list;
    if (!event) {
      // Clear all callbacks
      this._callbacks = {};
    } else if ((calls = this._callbacks)) {
      // Callbacks in general exist

      if (!callback) {
        // A callback argument was not supplied so we clear all callbacks of
        // an event
        calls[event] = [];

      } else if ((list = calls[event])) {
        // There exists callbacks for the supplied event

        // Find the callback and set it to null
        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === callback) {
            list[i] = null;
            break;
          }
        }
        /*
         * Q: Why don't we just splice the callback list here instead of in the
         * fire method?
         *
         * A: Because callbacks might call stopObserving themselves
         * (see testcase for this). If this happens we still have the fire
         * loop running on the same list - which was just spliced - and skip
         * the following callback in that list. This results in the next callback
         * not being called and throwing an error at the end of the loop.
         *
         * E.g. i < l but list[i] is out of bounds as the real length changed.
         *
         * We *could* just work with list copies - which is what the previous
         * implementation did using prototype enumeration functions - but that
         * is wasteful.
         */
      }
    }
    return this;
  }

  return {
    observe: observe,
    on: on,
    fire: fire,
    stopObserving: stopObserving,

    // Mirror some methods to match the jQ and Backbone Event API
    bind: observe,
    off: stopObserving,
    unbind: stopObserving,
    trigger: fire
  };
})();
