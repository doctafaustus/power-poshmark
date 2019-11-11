// Suspected both error happened after 835 shares
// Next time it was only after 81 shares
// Next time it was only 1089
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

  const idToSend = idsToShare.pop();
  $.ajax({
    type: 'PUT',
    url: `https://poshmark.com/vm-rest/users/self/shared_posts/${idToSend.id}`,
    success(response) {
      console.log(response, idsToShare.length, idToSend.name);
      localStorage.count = Number(localStorage.count) + 1; 
      if (response.error) {
        haltPosting = true;
        console.log('ERROR', response.error.errorType);
        // If errorType is suspected bot then show a waiting message and prompt user to fill out captcha
      }
      postToPoshmark(idsToShare);
    }
  });
}


function listenForCategoryContent(cb) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function(data) {
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

