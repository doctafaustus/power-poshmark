const ppActions = {
	'start-sharing': window.ppStartSharer,
	'stop-sharing': window.ppStopSharer,
	'resume-sharing': window.ppResumeSharing,
	'start-following': window.ppStartFollower,
	'stop-following': window.ppStopFollower,
	'resume-following': window.ppResumeFollowing,
	'start-bundling': window.ppStartBundler,
	'stop-bundling': window.ppStopBundler,
	'resume-bundling': window.ppResumeBundler
};

document.addEventListener('pp-event', e => {
	console.log('pp-event', e.detail);
  ppActions[e.detail.action](e.detail.argument);
});

let ppDataDiv = document.querySelector('#pp-data');
if (!ppDataDiv) {
	document.body.insertAdjacentHTML('beforeend', '<div style="display: none;" id="pp-data"></div>');
	ppDataDiv = document.querySelector('#pp-data');
}
