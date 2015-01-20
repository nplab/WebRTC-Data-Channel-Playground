 onmessage = function(e) {
  console.log('Message received from main script');
  setTimeout(function(){
  	postMessage(e.data);
  },e.data.sleep);
  
};