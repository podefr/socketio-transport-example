require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
* @license socketio-transport https://github.com/cosmosio/socketio-transport
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Olivier Scherrer <pode.fr@gmail.com>
*/
"use strict";

/**
 * Defines the SocketIOTransport
 * @private
 * @param {Object} $io socket.io's object
 * @returns
 */
module.exports = function SocketIOTransportConstructor($socket) {

	/**
	 * @private
	 * The socket.io's socket
	 */
	var _socket = null;

	/**
	 * Set the socket created by SocketIO
	 * @param {Object} socket the socket.io socket
	 * @returns true if it seems to be a socket.io socket
	 */
	this.setSocket = function setSocket(socket) {
		if (socket && typeof socket.emit == "function") {
			_socket = socket;
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Get the socket, for debugging purpose
	 * @private
	 * @returns {Object} the socket
	 */
	this.getSocket = function getSocket() {
		return _socket;
	};

	/**
	 * Subscribe to a socket event
	 * @param {String} event the name of the event
	 * @param {Function} func the function to execute when the event fires
	 */
	this.on = function on(event, func) {
		return _socket.on(event, func);
	};

	/**
	 * Subscribe to a socket event but disconnect as soon as it fires.
	 * @param {String} event the name of the event
	 * @param {Function} func the function to execute when the event fires
	 */
	this.once = function once(event, func) {
		return _socket.once(event, func);
	};

	/**
	 * Publish an event on the socket
	 * @param {String} event the event to publish
	 * @param data
	 * @param {Function} callback is the function to be called for ack
	 */
	this.emit = function emit(event, data, callback) {
		return _socket.emit(event, data, callback);
	};

	/**
	 * Stop listening to events on a channel
	 * @param {String} event the event to publish
	 * @param data
	 * @param {Function} callback is the function to be called for ack
	 */
	this.removeListener = function removeListener(event, data, callback) {
		return _socket.removeListener(event, data, callback);
	};

	/**
	 * Make a request on the node server
	 * @param {String} channel watch the server's documentation to see available channels
	 * @param data the request data, it could be anything
	 * @param {Function} func the callback that will get the response.
	 * @param {Object} scope the scope in which to execute the callback
	 */
	this.request = function request(channel, data, func, scope) {
		if (typeof channel == "string" &&
				typeof data != "undefined") {

			var reqData = {
					eventId: Date.now() + Math.floor(Math.random()*1e6),
					data: data
				},
				boundCallback = function () {
					if (func) {
						func.apply(scope || null, arguments);
					}
				};

			this.once(reqData.eventId, boundCallback);

			this.emit(channel, reqData);

			return true;
		} else {
			return false;
		}
	};

	/**
	 * Listen to an url and get notified on new data
	 * @param {String} channel watch the server's documentation to see available channels
	 * @param data the request data, it could be anything
	 * @param {Function} func the callback that will get the data
	 * @param {Object} scope the scope in which to execute the callback
	 * @returns
	 */
	this.listen = function listen(channel, data, func, scope) {
		if (typeof channel == "string" &&
				typeof data != "undefined" &&
				typeof func == "function") {

			var reqData = {
					eventId: Date.now() + Math.floor(Math.random()*1e6),
					data: data,
					keepAlive: true
				},
				boundCallback = function () {
					if (func) {
						func.apply(scope || null, arguments);
					}
				},
				that = this;

			this.on(reqData.eventId, boundCallback);

			this.emit(channel, reqData);

			return function stop() {
				that.emit("disconnect-" + reqData.eventId);
				that.removeListener(reqData.eventId, boundCallback);
			};
		} else {
			return false;
		}
	};

	/**
	 * Sets the socket.io
	 */
	this.setSocket($socket);
};

},{}],"5O999E":[function(require,module,exports){
/**
* @license socketio-transport https://github.com/cosmosio/socketio-transport
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Olivier Scherrer <pode.fr@gmail.com>
*/
"use strict";

module.exports = {
    Client: require("./client/index"),
    Server: require("./server/index")
};

},{"./client/index":1,"./server/index":4}],"socketio-transport":[function(require,module,exports){
module.exports=require('5O999E');
},{}],4:[function(require,module,exports){
/**
* @license socketio-transport https://github.com/cosmosio/socketio-transport
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Olivier Scherrer <pode.fr@gmail.com>
 */
var isConnected = false;

module.exports = function registerSocketIO(io, handlers) {

    if (isConnected) {
        return false;
    } else {

        // On connection we'll reference the handlers in socket.io
        io.sockets.on("connection", function (socket) {

            var connectHandler = function (func, handler) {
                // When a handler is called
                socket.on(handler, function (reqData) {

                    // Add socket.io's handshake for session management
                    reqData.data.handshake = socket.handshake;

                    // pass it the requests data
                    var stop = func(reqData.data,
                        // The function to handle the result
                        function onEnd(body) {
                            socket.emit(reqData.eventId, body);
                        },
                        // The function to handle chunks for a kept alive socket
                        function onData(chunk) {
                            reqData.keepAlive && socket.emit(reqData.eventId, ""+chunk);
                        });

                    // If func returned a stop function
                    if (typeof stop == "function") {
                        // Subscribe to disconnect-eventId event
                        socket.on("disconnect-"+reqData.eventId, stop);
                    }

                });

            };

            // for each handler, described in Emily as they can be used from node.js as well
            handlers.loop(connectHandler);
            // Also connect on new handlers
            handlers.watch("added", connectHandler);

        });

        isConnected = true;
    }
};

},{}]},{},[])