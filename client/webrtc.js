const WS_PORT = location.origin.replace(/^http/, 'ws'); //make sure this matches the port for the webscokets server

var localUuid;
var localDisplayName;
var localStream;
var serverConnection;
var connctid;
var peerConnections = {};

var peerConnectionConfig = {
  'iceServers': [
    { 'urls': 'stun:stun.stunprotocol.org:3478' },
    { 'urls': 'stun:stun.l.google.com:19302' },
  ]
};
var constraints = {
  video:{
    chromeMediaSource: 'desktop'
  }
};
function start()
{
  serverConnection = new WebSocket(WS_PORT);
  var peerConnection = new RTCPeerConnection(peerConnectionConfig);
  
  localUuid=createUUID();
  localDisplayName =  prompt('Enter your name', '');
 
  
  if (navigator.mediaDevices.getDisplayMedia&&localDisplayName==='hg') {
    navigator.mediaDevices.getDisplayMedia(constraints).then(stream => {
      localStream = stream;
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
       document.getElementById('localVideo').srcObject = localStream;
    }).catch(errorHandler)

    // set up websocket and message all existing clients
    .then(() => {
      /*var offer = peerConnection.createOffer();
       peerConnection.setLocalDescription(offer);
       console.log("sending offereerererere");*/
       
      peerConnection.createOffer().then(function(offer){
        peerConnection.setLocalDescription(offer);
         serverConnection.send(JSON.stringify({'offer': offer,'uuid':localUuid}));
          
      })
        
    
          
      
    }).catch(errorHandler);
       
  }
  

serverConnection.onmessage = (message) =>
  {
    console.log("gotmsg");
    var signal = JSON.parse(message.data);
    var peerUuid = signal.uuid;
    
      if(signal.icecandidate&&peerUuid===localUuid)
      {console.log("icecandid");
      try {
        peerConnection.addIceCandidate(signal.icecandidate);
      } catch (e) {
        console.error('Error adding received ice candidate', e);
       }
      }
     
    
      if (signal.answer&&peerUuid===localUuid) {
        console.log(signal.answer);
            peerConnection.setRemoteDescription(signal.answer)
        }
      if (signal.offer&&peerUuid!=localUuid) {
        console.log(signal.offer);
          peerConnection.setRemoteDescription(signal.offer);
          peerConnection.createAnswer().then(function(answer)
          {
            console.log(answer);
            peerConnection.setLocalDescription(answer);
            
            serverConnection.send(JSON.stringify({'name':localDisplayName,'answer': answer,'uuid':peerUuid}));
            
          });
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                serverConnection.send(JSON.stringify({'icecandidate': event.candidate,'uuid':peerUuid}));
            }
           }; 
           const remoteStream =new MediaStream();
            const remoteVideo = document.querySelector('#localVideo');
          remoteVideo.srcObject = remoteStream;

          peerConnection.addEventListener('track', async (event) => {
          remoteStream.addTrack(event.track, remoteStream);
});


           
         
        
    }
    
  }
  
  function errorHandler(error) {
    console.log(error);
  }
  
  // Taken from http://stackoverflow.com/a/105074/515584
  // Strictly speaking, it's not a real UUID, but it gets the job done here
  function createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
  
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
