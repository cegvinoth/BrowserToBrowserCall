var CallBox = React.createClass({
getInitialState: function() {
  InitiateWebApp();
  return {data: []};
},
componentDidMount: function() {
  var socket = io();
  socket.on('call progress event',function(call){
    var li = document.createElement('li');
    var callSid = document.createElement('h4');
    var to = document.createElement('h4');
    var fromNumber = document.createElement('h4');
    var callStatus = document.createElement('h4');

    callSid.textContent = 'Call SID: ' + call.callSid;
    to.textContent = 'To: ' + call.to;
    fromNumber.textContent = 'From: ' + call.fromNumber;
    callStatus.textContent = 'Call Status: ' + call.callStatus;

    li.appendChild(callSid);
    li.appendChild(to);
    li.appendChild(fromNumber);
    li.appendChild(callStatus);
    document.getElementById('phone-calls').appendChild(li);
  });
},
render: function() {
  return (
    <div className="callBox">
      Hello
    </div>
  );
}
});

ReactDOM.render(
<CallBox />,
document.getElementById('phone-calls')
);

function InitiateWebApp()
{
  log('Requesting Capability Token...');
  $.getJSON('/token')
  .done(function (data) {
    log('Got a token.');
    console.log('Token: ' + data.token);
    Twilio.Device.setup(data.token);
    Twilio.Device.ready(function (device) {
      log('Twilio.Device Ready!');
      document.getElementById('call-controls').style.display = 'block';
    });

    Twilio.Device.error(function (error) {
      log('Twilio.Device Error: ' + error.message);
    });

    Twilio.Device.connect(function (conn) {
      log('Successfully established call!');
      document.getElementById('button-call').style.display = 'none';
      document.getElementById('button-hangup').style.display = 'inline';
    });

    Twilio.Device.disconnect(function (conn) {
      log('Call ended.');
      document.getElementById('button-call').style.display = 'inline';
      document.getElementById('button-hangup').style.display = 'none';
    });

    Twilio.Device.incoming(function (conn) {
      log('Incoming connection from ' + conn.parameters.From);
      var archEnemyPhoneNumber = '+12099517118';

      if (conn.parameters.From === archEnemyPhoneNumber) {
        conn.reject();
        log('It\'s your nemesis. Rejected call.');
      } else {
        conn.accept();
      }
    });

    setClientNameUI(data.identity);
  })
  .fail(function () {
    log('Could not get a token from server!');
  });
  document.getElementById('button-call').onclick = function () {
    var params = {
      To: document.getElementById('phone-number').value
    };

    console.log('Calling ' + params.To + '...');
    Twilio.Device.connect(params);
  };
  document.getElementById('button-hangup').onclick = function () {
    log('Hanging up...');
    Twilio.Device.disconnectAll();
  };
}

function log(message) {
  var logDiv = document.getElementById('log');
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

function setClientNameUI(clientName) {
  var div = document.getElementById('client-name');
  div.innerHTML = 'Your client name: <strong>' + clientName +
  '</strong>';
}
