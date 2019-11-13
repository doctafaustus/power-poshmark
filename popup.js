chrome.tabs.query({active: true, currentWindow: true}, tabs => {

  const startSharingEl = document.querySelector('#start-my-sharer');
  startSharingEl.addEventListener('click', e => {
    triggerAction(e.target.id);
  });
  

  // Check for rs_id first, show login link if there's no id
  chrome.storage.sync.get('something', storage =>  {
  });


  // Receive custom messages from the content scripts
  chrome.runtime.onMessage.addListener(message => {
    console.log('message response', message);
    if (message.messageType === 'log') addLog(message.messageText);
  });

  function triggerAction(action) {
    // TODO: This initial call might need a response
    chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
      console.info('Response', response);
      //processResponse(response);
    });
  } 

});



function addLog(message) {
  const log = document.querySelector('.log');
  log.insertAdjacentHTML('afterbegin', message);
}