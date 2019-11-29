function ppStopBundler() {
  window.ppHaltBundler = true;
  document.body.classList.remove('pp-processing');
  window.ppMessage(`<div class="msg callout"><span class="log-body">Bundle scanning stopped.</span></div>`);
  document.querySelector('#pp-data').dataset.bundler = 'stopped';
}

function ppResumeBundler() {
  window.ppHaltBundler = false;
  document.body.classList.add('pp-processing');
  window.bundleCreator();
  document.querySelector('#pp-data').dataset.bundler = 'started';
}

function ppStartBundler() {
  console.log('ppStartBundler');
  document.body.classList.add('pp-processing');

  document.querySelector('#pp-data').dataset.bundler = 'started';

  var count = 0;
  const tracker = {};
  let lastBodyHeight = document.body.clientHeight;

  // Save all product IDs and titles
  let newsItems = [...document.querySelectorAll('.news-feed__item:not([data-pp-marked])')];

  window.bundleCreator = () => {
    count++;

    if (window.ppHaltBundler) {
      document.body.classList.remove('pp-processing');
      return;
    }

    if (!newsItems.length) {
      window.scrollTo(0, document.body.scrollHeight);
      window.ppMessage(`<div class="msg">Scanning...</div>`);
      return console.log('autoscrolling');
    }

    let item = newsItems.shift();
    item.setAttribute('data-pp-marked', true);

    const targetNode = item.querySelector('.news-feed__message a[href*="/closet/"]');
    if (!targetNode) return bundleCreator();;
    const parentNode = targetNode.closest('.tc--g')
    if (parentNode && /liked your listing/.test(parentNode.textContent)) {
      const user = targetNode.textContent;
      const item = targetNode.closest('a[data-et-element-type=list_item]');
      const array = tracker[user] || [];
      array.push({
        name: item.querySelector('img').getAttribute('alt'),
        url: `https://poshmark.com${item.getAttribute('href')}`
      });
      tracker[user] = array;

      if (tracker[user].length > 1) {
        console.log(tracker[user].length);
        const itemsLiked = tracker[user].map(item => {
          return `<span class="item"><a target="_blank" class="bundle-link" href="${item.url}">${item.name}</a></span>`
        });
        const message = `<div class="msg callout"><span class="log-body"><a class="bundle-user bundle-link" target="_blank" href="https://poshmark.com/closet/${user}">${user}</a> liked ${itemsLiked.join(', ')}</span></div>`;
        window.ppMessage(message);
      }
    }
    bundleCreator();

  };

  // Listen for lazy load images with XHR override
  function listenForNewsContent(cb) {
    const origFetch = window.fetch;
    window.fetch = function(url) {
      if (/\/vm-rest\/users\/(.*)\/newsfeed\//.test(url)) {
        cb();
      }
      return origFetch.apply(this, arguments)
    };
  }

  function getLazyLoadItems() {
    setTimeout(() => {
      // Check last recorded height of body to know when lazy load has stopped for good
      if (document.body.clientHeight <= lastBodyHeight) {
        const endMessage = `<div class="msg callout"><span class="log-body">Finished scanning.</span></div>`;
        document.body.classList.remove('pp-processing');
        return window.ppMessage(endMessage);
      }
      lastBodyHeight = document.body.clientHeight;
      if (window.ppHaltBundler) return;
      const lazyLoadedItems = [...document.querySelectorAll('.news-feed__item:not([data-pp-marked])')];
      newsItems = newsItems.concat(lazyLoadedItems);
      window.bundleCreator();
    }, 3500);
  }

  // Start sequence
  window.bundleCreator();
  listenForNewsContent(getLazyLoadItems);


}