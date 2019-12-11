if (window.location.hostname === 'localhost' || window.location.hostname.replace('www.', '') === 'powerposhmark.com') {
  if (window.location.pathname === '/account') {
    console.log('pp account');

    const emailInput = document.querySelector('#email-input');
    const subInput = document.querySelector('#sub-input');

    const email = emailInput && emailInput.value;
    const sub = subInput && subInput.value;

    if (email && sub) {
      console.log('sending data');
      chrome.runtime.sendMessage({
        category: 'pp_id_info',
        data: { email, sub }
      }, () => {
        const subscriptionDiv = document.querySelector('.subscription-value');
        const subscriptionValue = subscriptionDiv && subscriptionDiv.textContent.trim();
        if (subscriptionValue.length && subscriptionValue !== 'None') {
          document.querySelector('.extension-success').style.display = 'block';
        }
      });
    }
  }
} else {

  // The order of scripts matters - make sure all functions are defined first
  const scripts = ['./scripts/message.js', './scripts/sharer.js', './scripts/follower.js', './scripts/bundler.js', './scripts/init.js'];
  injectScripts();

  // Add message event listener
  document.addEventListener('pp-message', sendMessage);
  function sendMessage(e) {
    chrome.runtime.sendMessage({
      messageType: 'log',
      messageText: e.detail.messageText
    });
  }

  // Add overlay
  document.head.insertAdjacentHTML('beforeend', `<style id="pp-style">
    body.pp-processing {
      overflow: hidden !important;
    }
    body.pp-processing .pp-modal {
      display: block;
    }
    .pp-modal {
      display: none;
    }
    .pp-overlay {
      background-color: rgba(255, 255, 255, 0.72);
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    .pp-modal-inner {
      position: fixed;
      width: 391px;
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      right: 0;
      margin-left: auto;
      margin-right: auto;
      padding: 20px;
      z-index: 10001;
      background-color: #f84e75;
      border-radius: 6px;
      box-shadow: 0px 2px 3px rgba(0,0,0,0.3);
      max-height: calc(100vh - 203px);
      overflow-y: auto;
      text-align: left;
    }
    .pp-logo {
      text-align: center;
    }
    .pp-logo-image {
      width: 50px;
    }
    .pp-modal-message {
      color: #fff;
      text-align: center;
    }
    .pp-modal-message h2 {
      margin-top: 10px;
      margin-bottom: 8px;
      font-size: 24px;
    }
    .pp-close {
      display: inline-block;
      position: absolute;
      right: 20px;
      cursor: pointer;
    }
    .pp-close svg {
      width: 20px;
    }
  <style>`)
  document.body.insertAdjacentHTML('beforeend', `
    <div class="pp-modal">
      <div class="pp-modal-inner">
        <div class="pp-close">
          <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 512 512"><path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"/></svg>
        </div>
        <div class="pp-logo">
          <img class="pp-logo-image" src="https://res.cloudinary.com/dormh2fvt/image/upload/v1573709021/Site%20Images/logo.png">
        </div>
        <div class="pp-modal-message">
          <h2>Power Poshmark is processing</h2>
          <p>Please keep this tab active and do not interact with or scroll the window while the extension is scanning. Thank you!</p>
        </div>
      </div>
      <div class="pp-overlay"></div>
    </div>
  `);
  document.querySelector('.pp-close').addEventListener('click', () => {
    document.body.classList.remove('pp-processing');
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.action === 'get-username') {
      const usernameEl = document.querySelector('header a[href*="/closet/"]')
      if (!usernameEl) return sendResponse({ error: true });
      
      const username = usernameEl.getAttribute('href').replace('/closet/', '');
      return sendResponse({ username });
    }

    // If the pop was closed, halt all processes
    if (request.action === 'popup-closed') {
      console.log('Popup closed');

      // Send popup data to background script to save to storage
      const dummyLogEl = document.querySelector('#pp-dummy-log');
      const ppDataEl = document.querySelector('#pp-data');
      const log = dummyLogEl ? dummyLogEl.innerHTML : '';

      chrome.runtime.sendMessage({ 
        category: 'saveData',
        ppData: {
          log,
          reverseSharing: ppDataEl.dataset.reverseSharing,
          shareToParty: ppDataEl.dataset.shareToParty,
          sharingState: ppDataEl.dataset.sharingState,
          followState: ppDataEl.dataset.follow,
          unfollowState: ppDataEl.dataset.unfollow,
          bundlerState: ppDataEl.dataset.bundler
        }
      });

      return sendResponse({ ok: true });
    }

    document.dispatchEvent(new CustomEvent('pp-event', { 
      detail: {
        action: request.action,
        argument: request.argument
      } 
    }));


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

}