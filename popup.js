// When popup.us opens, send message to content script to extract recipe data
// On response, populate the extension form with the returned data
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

  // Check for rs_id first, show login link if there's no id
  chrome.storage.sync.get('something', storage =>  {
    console.log(storage);
  });

  chrome.tabs.sendMessage(tabs[0].id, {rsAction: 'extract'}, function(response) {
    console.info('Response', response);
    processResponse(response);
  });

});


function processResponse(response) {
  if (!response) return console.log('No response');
}
