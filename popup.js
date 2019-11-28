chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  // Save tab info
  const tab = tabs[0];
  const tabUrl = tab.url;

  // Get username
  let username = null;
  triggerAction('get-username');

  initToggleLog();

  initAutoSharer();
  initAutoFollower();
  initBundler();


  // Receive custom messages from the content scripts
  chrome.runtime.onMessage.addListener(message => {
    if (message.messageType === 'log') addLog(message.messageText);
  });

  function triggerAction(action, argument) {
    // TODO: This initial call might need a response
    chrome.tabs.sendMessage(tabs[0].id, { action, argument }, (response) => {
      console.info('Response', response);
      if (response && response.username) username = response.username;
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

      e.target.disabled = true;
      e.target.nextElementSibling.disabled = false;

      if (e.target.textContent === 'Resume') {
        triggerAction('resume-bundling');
      } else {
        triggerAction('start-bundling');
      }
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

    // Add sharing button listeners
    startSharingBtn.addEventListener('click', e => {
      // Check if on relevant URL
      // if (!/\/closet\//.test(tabUrl)) {
      //   const link = (username) ? `closet/${username}` : 'login';
      //   return addLog(`
      //     <span class="msg error">Not on right page. Go to your <a target="_blank" href="https://poshmark.com/${link}">closet</a> page first.</span>
      // `);
      // }

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

    stopSharingBtn.addEventListener('click', e => {
      console.log('stop sharing');
      // Change Start button text to "Resume"
      e.target.disabled = true;
      e.target.previousElementSibling.disabled = false;
      e.target.previousElementSibling.textContent = 'Resume';

      reverseSharingEl.disabled = false;false
      shareToPartyEl.disabled = false;
      document.querySelector('.auto-sharer .options').classList.remove('disabled');

      triggerAction('stop-sharing');
    });
  }

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
}
