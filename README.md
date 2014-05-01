#socketio-transport example

start server:

```bash
node server.js
```

open index.html:

```bash
open public/index.html
```

##Server side configuration

```js
var socketioTransport = require("socketio-transport").Server;
var io = require('socket.io').listen(8000);
var Store = require("observable-store");

socketioTransport(io, new Store({
    test: function (payload, onEnd, onData) {
        setInterval(function () {
            onData((new Date));
        }, 200);
    },

    // other handlers here .....
}));
```

##Client side

```js
var SocketioTransport = require("socketio-transport").Client;
var socket = io.connect('http://localhost:8000');

var socketioTransport = new SocketioTransport(socket);

socketioTransport.listen("test", {}, function () {
    console.log(arguments);
}, function () {
    console.log(arguments);
});
```


See that a channel is open on `test` and publishes dates every 200ms in the console.

#LICENSE

MIT
