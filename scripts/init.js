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

