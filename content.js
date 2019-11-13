console.log('Power Poshmark content script');

// The order of scripts matters - make sure all functions are defined first
const scripts = ['./scripts/message.js', './scripts/sharer.js', './scripts/init.js'];
injectScripts();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	document.dispatchEvent(new CustomEvent('pp-event', { 
		detail: {
			action: request.action
		} 
	}));

	document.addEventListener('pp-message', e => {
		console.log('pp-message', e.detail);
		chrome.runtime.sendMessage({
			messageType: 'log',
			messageText: e.detail.messageText
		});
	});


	// We need to return true to get around this error: "The message port closed before a response was received."
	return true; 
});


// Load core scripts in sequence
function injectScripts() {
	console.log('injectScripts')
	if (!scripts.length) return console.log('Done loading scripts');
	const s = document.createElement('script');
	s.src = chrome.runtime.getURL(scripts.shift());
	s.onload = () => { 
		s.remove();
		injectScripts();
	};
	document.head.insertAdjacentElement('beforeend', s);
}