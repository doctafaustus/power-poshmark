function ppStopFollower(action) {
  window.ppHaltFollowing = true;
  document.body.classList.remove('pp-processing');
  window.ppMessage(`<div class="msg callout"><span class="log-body">Pausing ${action}ing.</span></div>`)
}

function ppResumeFollowing(action) {
  window.ppFollowerAction = action;
  window.ppHaltFollowing = false;
  document.body.classList.add('pp-processing');
  window.followUsers();
}

function ppStartFollower(action) {
  document.body.classList.add('pp-processing');
  window.ppFollowerAction = action;

  // Save flag to halt/resume following
  window.ppHaltFollowing = false;
  let lastBodyHeight = document.body.clientHeight;
  let numFollowers = 0;
  let finishFollowing = false;
    
  // Save all user names
  let usersToFollow = [...document.querySelectorAll('.follower-following-list .item')];
  usersToFollow = usersToFollow.filter(itemNode => {
    const actionNode = itemNode.querySelector(`#${window.ppFollowerAction}-user`);
    return !actionNode.classList.contains('f-hide');
  });
  usersToFollow = usersToFollow.map(node => {
    return { 
      id: node.getAttribute('item-id'),
      handle: node.querySelector('.user-content h5 a').textContent
    };
  });
  

  window.followUsers = () => {
    
    if (window.ppHaltFollowing) {
      document.body.classList.remove('pp-processing'); 
      return;
    }

    if (!usersToFollow.length) {
      const findingMoreMessage = `<div class="msg callout"><span class="log-body">Searching for users to ${window.ppFollowerAction}...</span></div>`;
      window.ppMessage(findingMoreMessage);
      return setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(() => {
          console.log(document.body.clientHeight, lastBodyHeight)
          // Check last recorded height of body to know when lazy load has stopped for good
          if (document.body.clientHeight <= lastBodyHeight) {
            const endMessage = `<div class="msg callout"><span class="log-body">Finished following.</span></div>`;
            document.body.classList.remove('pp-processing');
            if (!finishFollowing) window.ppMessage(endMessage);
            finishFollowing = true;
            return;
          }
          lastBodyHeight = document.body.clientHeight;
        }, 3500);
      }, 3000);
    }
  
    const userToFollow = usersToFollow.shift();
    $.ajax({
      type: 'POST',
      url: `https://poshmark.com/user/${userToFollow.id}/${window.ppFollowerAction}_user`,
      success(response) {
        numFollowers++;
        //console.log(response, usersToFollow.length, userToFollow.handle);

        const logMessage = `<div class="msg"><span class="log-num">${numFollowers}</span> <span class="log-body">${window.ppFollowerAction === 'follow' ? 'Followed' : 'Unfollowed'} ${userToFollow.handle}</span></div>`;
        window.ppMessage(logMessage);

        // Artificially show/hide follow/unfollow button
        const button = document.querySelector(`.item a[data-ajax-href="/user/${userToFollow.id}/${window.ppFollowerAction}_user"]`);
        const otherButton = (window.ppFollowerAction === 'follow') ? button.nextElementSibling : button.previousElementSibling;
        button.classList.add('f-hide');
        otherButton.classList.remove('f-hide');

        if (response.error) {
          window.ppHaltFollowing = true;
          document.body.classList.remove('pp-processing');
          console.log('ERROR', response.error);
        }
        setTimeout(followUsers, 250);
      },
      error(jqXHR, textStatus, errorThrown) {
        document.body.classList.remove('pp-processing');
        if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.error_type === 'SuspectedBotError') {
          console.log('SUSPECTED BOT');
          triggerCaptcha();
        } else {
          console.log(jqXHR);
        }
      }
    });
  }

  function triggerCaptcha() {
    document.querySelector(`#${window.ppFollowerAction}-user`).click();
    const botErrorMessage = `<div class="msg error"><span class="log-body">Sharing stopped by site - Captcha required.</span></div>`;
    window.ppMessage(botErrorMessage);
  }

  
  function listenForUsers(cb) {
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.addEventListener('load', function() {
        if (this.readyState === 4 && /user\/\w+\/(followers|following)/.test(url) ||
            this.readyState === 4 && url.includes('https://poshmark.com/search?query=')) {
          cb(JSON.parse(this.responseText));
        }
      });
      origOpen.apply(this, arguments);
   };
  }
  
  function getLazyLoadIDs(data) {
    const $html = $(data.html);
    let ids = [...$html].filter(itemNode => {
      const actionNode = itemNode.querySelector(`#${window.ppFollowerAction}-user`);
      return !actionNode.classList.contains('f-hide');
    });
    ids = ids.map(itemNode => {
      return { 
        id: itemNode.getAttribute('item-id'),
        handle: itemNode.querySelector('.user-content h5 a').textContent
      };
    });
  
    usersToFollow = usersToFollow.concat(ids);
    window.followUsers();
  }
  
  // Begin sequence
  window.followUsers();
  listenForUsers(getLazyLoadIDs);
}