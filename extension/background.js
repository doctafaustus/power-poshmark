let idToTrack;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.category === 'track') {
    idToTrack = message.popupOpenedTab;
    // console.log('idToTrack', idToTrack);
  }

  if (message.category === 'saveData') {
    // console.log('saving', message.ppData);

    chrome.storage.local.set({ ppData: message.ppData }, function() {
      // console.log('data saved!');
    });
  }

  if (message.category === 'pp_id_info') {
    chrome.storage.sync.set({ 'ppEmail': message.data.email, 'ppSub': message.data.sub }, function() {
      console.log('data saved!');
    });
  }


});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  // If the tab that was refreshed was the same as the ID we're tracking then let popup know to clear storage
  if (tabId === idToTrack) {
    console.log('Page was refreshed');

    chrome.storage.local.set({ ppData: {} }, function() {
      console.log('ppData cleared!');
    });
  }
});




chrome.windows.onFocusChanged.addListener(function(windowID) {
  // console.log('windowID', windowID);

  // If the windowID is -1 then the popup was closed
  if (windowID !== -1) {
    // console.log('popup closed');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {action: 'popup-closed'}, function(response) {
        // console.log('Acknowledged');
      });  
    });
  }
});



