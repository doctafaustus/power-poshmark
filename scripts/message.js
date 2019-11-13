function ppMessage(message) {
	document.dispatchEvent(new CustomEvent('pp-message', { 
		detail: {
			messageText: message
		} 
	}));
}