var haltFlow = false;
var count = 0;
var action = 'follow';


var usersToFollow = [...document.querySelectorAll('.follower-following-list .item')];
usersToFollow = usersToFollow.filter(itemNode => {
  const actionNode = itemNode.querySelector(`#${action}-user`);
  return !actionNode.classList.contains('f-hide');
});
usersToFollow = usersToFollow.map(node => {
  return { 
    id: node.getAttribute('item-id'),
    handle: node.querySelector('.user-content h5 a').textContent
  };
});


followUsers();
listenForUsers(getLazyLoadIDs);

function followUsers() {
  console.log('followUsers');
  if (haltFlow) return console.log('Flow halted');
  
  if (!usersToFollow.length) {
    console.log('no users to follow')
    // Add a timeout to allow content to load
    return setTimeout(() => {
      console.log('AutoScrolling');
      window.scrollTo(0,document.body.scrollHeight);
    }, 2000);

  }

  const userToFollow = usersToFollow.shift();
  $.ajax({
    type: 'POST',
    url: `https://poshmark.com/user/${userToFollow.id}/${action}_user`,
    success(response) {
      console.log(response, usersToFollow.length, userToFollow.handle);
      count += 1;
      if (response.error) {
        haltPosting = true;
        console.log('ERROR', response.error);
      }
      setTimeout(followUsers, 250);
    },
    error(jqXHR, textStatus, errorThrown) {
      if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.error_type === 'SuspectedBotError') {
        console.log('SUSPECTED BOT')
      }
    }
  });
}

function listenForUsers(cb) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      if (this.readyState === 4 && /user\/clowd151\/(followers|following)/.test(url) ||
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
    const actionNode = itemNode.querySelector(`#${action}-user`);
    return !actionNode.classList.contains('f-hide');
  });
  ids = filteredIDs.map(itemNode => {
    return { 
      id: itemNode.getAttribute('item-id'),
      handle: itemNode.querySelector('.user-content h5 a').textContent
    };
  });

  usersToFollow = usersToFollow.concat(ids);

  followUsers();
}


