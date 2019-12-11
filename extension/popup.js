// Set dev or prod site
const mode = 'prod';
const site = (mode === 'prod') ? 'http://www.powerposhmark.com' : 'http://localhost:3000';


init();

function init() {
  let isFullVersion = false;

  // Check storage for version type
  chrome.storage.sync.get('ppEmail', emailStorage => {
    if (emailStorage.ppEmail) {

      // Check ppData
      chrome.storage.sync.get('ppSub', storage => {
        if (storage.ppSub) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${site}/check`, true);
          xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
              console.log('User has Full version!');
              document.querySelector('.version-text').textContent = 'Full Version';
              document.querySelector('.email').textContent = emailStorage.ppEmail;
              isFullVersion = true;
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
              showTrialVersion();
            }
          };
          xhr.send(JSON.stringify({ sub: storage.ppSub }));
        }
      });
    } else {
      showTrialVersion();
    }

    function showTrialVersion() {
      console.log('Not full version');
      document.querySelector('.version-text').textContent = 'Trial Version';
      document.querySelector('.email').innerHTML = `<a href="${site}" target="_blank">Get Full Version</a>`;
    }
  });

  // Reset daily trial values
  chrome.storage.sync.get('trialStorage', storage => {
    if (!storage.trialStorage) return;
    const keys = Object.keys(storage.trialStorage);
    const twentyFourHours = 86400000;

    keys.forEach(key => {
      if (storage.trialStorage[key].timestamp &&
        new Date().getTime() - storage.trialStorage[key].timestamp >= twentyFourHours) {
          console.log('CLEARING', storage.trialStorage[key]);
          delete storage.trialStorage[key].limitReached;
          delete storage.trialStorage[key].timestamp;
      }
    });

    chrome.storage.sync.set({ trialStorage: storage.trialStorage });
  });

  // Get any potential status message from server
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const res = JSON.parse(xhr.responseText);
      if (res.status !== 'ok') addLog(res.status);
    }
  }
  xhr.open('GET', `${site}/status`, true);
  xhr.send(null);


  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    // Save tab info
    const tab = tabs[0];
    const tabUrl = tab.url;

    chrome.runtime.sendMessage({ 
      category: 'track',
      popupOpenedTab: tabs[0].id
    });


    // Get username
    let username = null;
    if (!tabUrl.includes('powerposhmark')) {
      console.log('getting username');
      triggerAction('get-username');
    }

    initToggleLog();

    initAutoSharer();
    initAutoFollower();
    initBundler();


    // Receive custom messages from the content scripts
    chrome.runtime.onMessage.addListener(message => {
      if (message.messageType === 'log') addLog(message.messageText);
    });

    // Delegate on bundle links to force storage saving
    document.querySelector('.log').addEventListener('click', e => {
      if (e.target.matches('.bundle-link')) { 
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'popup-closed' });
        window.location
        console.log('Forcing data save');
        chrome.tabs.create({ url: e.target.href, active: false });
      }
    });


    function triggerAction(action, argument) {
      // TODO: This initial call might need a response
      chrome.tabs.sendMessage(tabs[0].id, { action, argument }, (response) => {
        console.info('Response', response);
        if (response && response.username) {
          username = response.username;
          console.log('username set!');
        } else if (response && response.error) {
          addLog(`<span class="msg error">Please log into your account on poshmark.com first.</span>`);
        }
      });
    } 


    function initBundler() {
      // Define bundler buttons
      const startBtn = document.querySelector('#start-bundle');
      const stopBtn = document.querySelector('#stop-bundle');

      startBtn.addEventListener('click', e => {
        if (!tabUrl.includes('poshmark.com/news')) {
          return addLog(`
            <span class="msg error">Not on right page. Go to your <a target="_blank" href="https://poshmark.com/news">news page</a> first to begin scanning.</span>
          `);
        }

        checkLimitReached('bundle', () => {

          e.target.disabled = true;
          e.target.nextElementSibling.disabled = false;

          if (e.target.textContent === 'Resume') {
            triggerAction('resume-bundling');
          } else {
            triggerAction('start-bundling');
          }
        });
      });

      stopBtn.addEventListener('click',  e => {
        // Change Start button text to "Resume"
        e.target.disabled = true;
        e.target.previousElementSibling.disabled = false;
        e.target.previousElementSibling.textContent = 'Resume';
        triggerAction('stop-bundling');
      });
    }

    function initAutoFollower() {
      // Define following buttons
      const startBtns = document.querySelectorAll('#start-following, #start-unfollowing');
      const stopBtns = document.querySelectorAll('#stop-following, #stop-unfollowing');

      // Add (un)follow button listeners
      startBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          console.log(tabUrl);
          // Check if on relevant URL
          if (!/\/search\?(.*)type=people/.test(tabUrl) && !/\/user\/\w+\/follow/.test(tabUrl)) {
            const followersLink = (username) ? `user/${username}/followers` : 'login';
            const followingLink = (username) ? `user/${username}/following` : 'login';
            return addLog(`
              <span class="msg error">Not on right page. Go to your either your <a target="_blank" href="https://poshmark.com/${followersLink}">followers page</a>, <a target="_blank" href="https://poshmark.com/${followingLink}">following page</a>, or a people search page first such as this <a target="_bank" href="https://poshmark.com/search?query=a&type=people">one</a>.</span>
            `);
          }

          checkLimitReached(btn.dataset['action'], () => {
            // Disallow follow and unfollow processes at the same time
            if (btn.id === 'start-unfollowing' && document.querySelector('#start-following').disabled) {
              return addLog(`<span class="msg error">Please stop Follow Users process first.</span>`);
            } else if (btn.id === 'start-following' && document.querySelector('#start-unfollowing').disabled) {
              return addLog(`<span class="msg error">Please stop Unfollow Users process first.</span>`);
            }

            e.target.disabled = true;
            e.target.nextElementSibling.disabled = false;

            if (e.target.textContent === 'Resume') {
              triggerAction('resume-following', btn.dataset['action']);
            } else {
              triggerAction('start-following', btn.dataset['action']);
            }
          });
        });
      });

      stopBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          console.log('stop (un)folowing');
          // Change Start button text to "Resume"
          e.target.disabled = true;
          e.target.previousElementSibling.disabled = false;
          e.target.previousElementSibling.textContent = 'Resume';
          triggerAction('stop-following', btn.dataset['action']);
        });
      });

    }

    function initAutoSharer() {
      // Define sharing buttons
      const startSharingBtn = document.querySelector('#start-my-sharer');
      const stopSharingBtn = document.querySelector('#stop-my-sharer');
      const reverseSharingEl = document.querySelector('#reverse-sharing');
      const shareToPartyEl = document.querySelector('#share-to-party');

      // Reset button states on checkbox click
      [reverseSharingEl, shareToPartyEl].forEach(checkbox => {
        checkbox.addEventListener('click', () => {
          console.log('checkbox clicked');
          stopSharingBtn.click();
          startSharingBtn.textContent = 'Start';
        });
      });


      // Add sharing button listeners
      startSharingBtn.addEventListener('click', e => {
        // Check if on closet page
        if (!/\/closet\//.test(tabUrl)) {
          const link = (username) ? `closet/${username}` : 'login';
          return addLog(`
            <span class="msg error">Not on right page. Go to your <a target="_blank" href="https://poshmark.com/${link}">closet</a> page first.</span>
        `);
        }

        checkLimitReached('share', () => {
          const reverseSharing = reverseSharingEl.checked;
          const shareToParty = shareToPartyEl.checked;
      
          reverseSharingEl.disabled = true;
          shareToPartyEl.disabled = true;
          document.querySelector('.auto-sharer .options').classList.add('disabled');
  
          e.target.disabled = true;
          e.target.nextElementSibling.disabled = false;
  
  
          if (e.target.textContent === 'Resume') {
            triggerAction('resume-sharing', { reverseSharing, shareToParty });
          } else {
            triggerAction('start-sharing', { reverseSharing, shareToParty });
          }
        });
      });

      stopSharingBtn.addEventListener('click', e => {
        console.log('stop sharing');
        // Change Start button text to "Resume"
        e.target.disabled = true;
        e.target.previousElementSibling.disabled = false;
        e.target.previousElementSibling.textContent = 'Resume';

        reverseSharingEl.disabled = false;
        shareToPartyEl.disabled = false;
        document.querySelector('.auto-sharer .options').classList.remove('disabled');

        triggerAction('stop-sharing');
      });
    }

    // Get log data and options from storage
    chrome.storage.local.get('ppData', storage => {
      console.log('heres your storage', storage);

      if (!storage.ppData) return;

      if (storage.ppData.log) {
        addLog(storage.ppData.log);
      }

      if (storage.ppData.reverseSharing === "true") {
        document.querySelector('#reverse-sharing').checked = true;
      }

      if (storage.ppData.shareToParty === "true") {
        document.querySelector('#share-to-party').checked = true;
      }


      const startSharingBtn = document.querySelector('#start-my-sharer');
      const startFollowBtn = document.querySelector('#start-following');
      const startUnfollowBtn = document.querySelector('#start-unfollowing');
      const startBundling = document.querySelector('#start-bundle');

      if (storage.ppData.sharingState === 'started') {
        startSharingBtn.disabled = true;
        startSharingBtn.nextElementSibling.disabled = false;
        document.querySelector('#reverse-sharing').disabled = true;
        document.querySelector('#share-to-party').disabled = true;
        document.querySelector('.auto-sharer .options').classList.add('disabled');
      } else if (storage.ppData.sharingState === 'stopped') {
        startSharingBtn.textContent = 'Resume';
        startSharingBtn.nextElementSibling.disabled = true;
      }

      if (storage.ppData.followState === 'started') {
        startFollowBtn.disabled = true;
        startFollowBtn.nextElementSibling.disabled = false;
      } else if (storage.ppData.followState === 'stopped') {
        startFollowBtn.textContent = 'Resume';
        startFollowBtn.nextElementSibling.disabled = true;
      }

      if (storage.ppData.unfollowState === 'started') {
        startUnfollowBtn.disabled = true;
        startUnfollowBtn.nextElementSibling.disabled = false;
      } else if (storage.ppData.unfollowState === 'stopped') {
        startUnfollowBtn.textContent = 'Resume';
        startUnfollowBtn.nextElementSibling.disabled = true;
      }

      if (storage.ppData.bundlerState === 'started') {
        startBundling.disabled = true;
        startBundling.nextElementSibling.disabled = false;
      } else if (storage.ppData.bundlerState === 'stopped') {
        startBundling.textContent = 'Resume';
        startBundling.nextElementSibling.disabled = true;
      }

    });

  });

  function initToggleLog() {
    const logLabel = document.querySelector('.log-label-group');
    const logContainer = document.querySelector('.log-container');
    logLabel.addEventListener('click', () => {
      const fullClass = 'full'
      if (logContainer.classList.contains(fullClass)) {
        logContainer.classList.remove(fullClass);
      } else {
        logContainer.classList.add(fullClass);
      }
    });
  }


  function addLog(message) {
    const log = document.querySelector('.log');
    log.insertAdjacentHTML('afterbegin', message);
    
    // Handle captcha
    if (message === '<div class="msg error"><span class="log-body">Sharing stopped by site - Captcha required.</span></div>') {
      document.querySelector('#stop-my-sharer').click();
    } else if (message === '<div class="msg error"><span class="log-body">Following process stopped by site - Captcha required.</span></div>') {
      document.querySelectorAll('.auto-follower button.stop').forEach(btn => btn.click());
    }

    if (!isFullVersion) {
      checkTrialAllowance(message);
    }
  }

  let shareCount = 0;
  let followCount = 0;
  let unfollowCount = 0;
  let bundleCount = 0;

  function checkTrialAllowance(message) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message;
    
    const messageDiv = tempDiv.querySelector('.msg');

    if (messageDiv.classList.contains('share')) {
      shareCount++;
      if (shareCount >= 30) setLimitReached('share');
    } else if (messageDiv.classList.contains('follow')) {
      followCount++;
      if (followCount >= 30) setLimitReached('follow');
    } else if (messageDiv.classList.contains('unfollow')) {
      unfollowCount++;
      if (unfollowCount >= 30) setLimitReached('unfollow');
    } else if (messageDiv.classList.contains('bundle')) {
      bundleCount++;
      if (bundleCount >= 1) setLimitReached('bundle');
    }
  }

  function setLimitReached(category) {
    chrome.storage.sync.get( 'trialStorage', storage => {
      storage.trialStorage = storage.trialStorage || {};

      storage.trialStorage[category] = {
        limitReached: true,
        timestamp: new Date().getTime()
      }
      chrome.storage.sync.set({ trialStorage: storage.trialStorage });
    });

    document.querySelectorAll('.stop').forEach(stopBtn => stopBtn.click());
    addLog('<span class="msg error">Trial limit reached for the day. Upgrade <a target="_blank" href="http://www.powerposhmark.com">here!</a></span>');
  }

  function checkLimitReached(category, cb) {
    if (isFullVersion) return cb();
    
    chrome.storage.sync.get('trialStorage', storage => {
      if (storage.trialStorage && storage.trialStorage[category] && storage.trialStorage[category].limitReached) {
        addLog('<span class="msg error">Trial limit reached for the day. Upgrade <a target="_blank" href="http://www.powerposhmark.com">here!</a></span>');
      } else {
        cb();
      }
    });
  }
} 