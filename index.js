/*
Tries b/t suspected bot errors
835
81
1089
873
207
522
1002
930 - follow
*/

var idsToShare = [...document.querySelectorAll('.tile')].map(node => {
  return { id: node.id, name: node.querySelector('.title').textContent }
});

var haltPosting = false;

function postToPoshmark() {
  if (haltPosting) return;
  
  if (!idsToShare.length) {
    console.log('AutoScrolling');
    return window.scrollTo(0,document.body.scrollHeight);
  }

  const idToSend = idsToShare.shift();
  $.ajax({
    type: 'PUT',
    url: `https://poshmark.com/vm-rest/users/self/shared_posts/${idToSend.id}`,
    success(response) {
      console.log(response, idsToShare.length, idToSend.name);
      localStorage.count = Number(localStorage.count) + 1; 
      if (response.error) {
        haltPosting = true;
        console.log('ERROR', response.error.errorType);
        if (response.error.errorType === 'SharePostRequestLimitExceededError') {
          setTimeout(() => {
            haltPosting = false;
            postToPoshmark();
          }, 30000);
        } else if (response.error.errorType === 'SuspectedBotError') {
          console.log('triggerCaptcha');
          triggerCaptcha();
        }
      }
      setTimeout(postToPoshmark, 250);
    }
  });
}


function listenForCategoryContent(cb) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      if (this.readyState === 4 && url.includes('https://poshmark.com/category')) {
        cb(JSON.parse(this.responseText)) ;
      }
    });
    origOpen.apply(this, arguments);
 };
}

listenForCategoryContent(getLazyLoadIDs);


function getLazyLoadIDs(data) {
  window.x = data;
  const $html = $(data.html);
  const ids = [...$html].map(itemNode => {
    return { 
      id: itemNode.querySelector('.tile').id, 
      name: itemNode.querySelector('.title').textContent
    };
  });

  console.log(`Found ${ids.length} more products`);
  idsToShare = idsToShare.concat(ids);

  console.log('idsToShare:', idsToShare);
  postToPoshmark();
}


function triggerCaptcha() {
  document.querySelector('.share').click();
  setTimeout(() => {
    document.querySelector('#share-popup a').click();
  }, 1000);
}

postToPoshmark();







var items = [...document.querySelectorAll('.follower-following-list .item:not([ext-processed])')];

function followUsers(lastCall) {

  if (!items.length && lastCall) {
    return console.log('done for realz');
  } else if (!items.length ) {
    console.log('next wave');
    return window.scrollTo(0,document.body.scrollHeight);
  }

  const item = items.shift();
  const handle = item.querySelector('.user-content h5 a').textContent;
  const followBtn = item.querySelector('#unfollow-user');

  if (!followBtn.classList.contains('f-hide')) {
    followBtn.click();
    console.log(`Now following ${handle}`);
  }

  item.setAttribute('ext-processed', true);
  setTimeout(() => {
    followUsers(lastCall);
  }, 250);
}

followUsers();
listForFollowersLoad((data) => {
  setTimeout(() => {

    var lastCall = data.max_id === null;
    items = items.concat([...document.querySelectorAll('.follower-following-list .item:not([ext-processed])')]);
    console.log('items', items);
    followUsers(lastCall);
  }, 1000);
});

function listForFollowersLoad(cb) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      if (this.readyState === 4 && url.includes('https://poshmark.com/user/clowd151/followers')) {
        cb(JSON.parse(this.responseText));
      }
    });
    origOpen.apply(this, arguments);
  };
}
