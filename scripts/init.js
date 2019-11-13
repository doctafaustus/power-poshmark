const ppActions = {
	'start-my-sharer': window.ppSharer
};


document.addEventListener('pp-event', e => {
	console.log('pp-event', e.detail);
  ppActions[e.detail.action]();
});

