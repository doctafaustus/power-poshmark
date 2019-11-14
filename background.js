chrome.windows.onFocusChanged.addListener(function(windowID) {
  console.log('windowID', windowID);

  // If the windowID is -1 then the popup was closed
  if (windowID !== -1) {
    console.log('window closed');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {action: 'popup-closed'}, function(response) {
        console.log('Acknowledged');
      });  
    });
  }
});

