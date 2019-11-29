function ppMessage(message) {

	// Save messages in the DOM to save to localStorage on popup close
	const ppDummyLog = document.querySelector('#pp-dummy-log');
	if (!ppDummyLog) {
		document.body.insertAdjacentHTML('beforeend', '<div style="display: none;" id="pp-dummy-log"></div>');
	}
	document.querySelector('#pp-dummy-log').insertAdjacentHTML('afterbegin', message);

	document.dispatchEvent(new CustomEvent('pp-message', { 
		detail: {
			messageText: message
		} 
	}));
}