var socketioTransport = require("socketio-transport").Server;
var io = require('socket.io').listen(8000);
var Store = require("observable-store");

socketioTransport(io, new Store({
    test: function (payload, onEnd, onData) {
        setInterval(function () {
            onData((new Date));
        }, 200);
    }
}));
