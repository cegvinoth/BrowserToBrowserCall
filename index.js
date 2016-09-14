var http = require('http');
var path = require('path');
var twilio = require('twilio');
var express = require('express');
var bodyParser = require('body-parser');
var randomUsername = require('./randos');
var config = require('./config');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/token', function(request, response) {
  var identity = randomUsername();

  var capability = new twilio.Capability(config.TWILIO_ACCOUNT_SID,
    config.TWILIO_AUTH_TOKEN);
    capability.allowClientOutgoing(config.TWILIO_TWIML_APP_SID);
    capability.allowClientIncoming(identity);
    var token = capability.generate();
    response.send({
      identity: identity,
      token: token
    });
  });

  app.post('/voice', function (req, res) {

    console.log("abc:"+req.body.CallStatus);
    var twiml = new twilio.TwimlResponse();

    if(req.body.To) {
      twiml.dial({ callerId: config.TWILIO_CALLER_ID}, function() {
        if (/^[\d\+\-\(\) ]+$/.test(req.body.To)) {
          this.number({statusCallbackEvent:['initiated ringing answered'],statusCallback:'http://cbdb91e7.ngrok.io/events',statusCallbackMethod: 'POST'},req.body.To);
        } else {
          this.client({statusCallbackEvent:['initiated ringing answered'],statusCallback:'http://cbdb91e7.ngrok.io/events',statusCallbackMethod: 'POST'},req.body.To);
        }
      });
    } else {
      twiml.say("Thanks for calling!");
    }

    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  });

  var server = http.createServer(app);
  var port = process.env.PORT || 3000;
  server.listen(port, function() {
    console.log('Express server running on *:' + port);
  });

  const io = require('socket.io')(server);
  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  app.post('/events', function(request, response) {
    var to = request.body.To;
    var fromNumber = request.body.From;
    var callStatus = request.body.CallStatus;
    var callSid = request.body.CallSid;

    io.emit('call progress event', { to, fromNumber, callStatus, callSid });

    console.log(to, fromNumber, callStatus, callSid);
    response.send('Event received');
  });
