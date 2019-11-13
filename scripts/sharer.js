function ppSharer() {
  //if (!/^\/closet\//.test(window.location.pathname)) return console.log('no on right page');
  console.log('yo yo ');

  // Save all product IDs and titles
  let productsToShare = [...document.querySelectorAll('.tile')].map(node => {
    return { id: node.id, name: node.querySelector('.title').textContent }
  });
  
  // Save flag to halt posting
  let haltPosting = false;
  let numProductsShared = 0;
  

  listenForCategoryContent(getLazyLoadIDs);
  postToPoshmark();


  function postToPoshmark() {

    // Return if haltPosting flag is true
    if (haltPosting) return console.log('halt posting');
    
    // If there are no more products then autoscroll down to trigger lazy load
    if (!productsToShare.length) {
      console.log('AutoScrolling');
      return window.scrollTo(0,document.body.scrollHeight);
    }
  
    // Use and remove the first product in the array
    const productToSend = productsToShare.shift();
    $.ajax({
      type: 'PUT',
      url: `https://poshmark.com/vm-rest/users/self/shared_posts/${productToSend.id}`,
      success(response) {
        numProductsShared++;
        console.log(response, productsToShare.length, productToSend.name);

        const logMessage = `<div class="msg"><span class="log-num">${numProductsShared}</span> <span class="log-body">Shared ${productToSend.name}</span></div>`;
        window.ppMessage(logMessage);
        
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

        // Stagger requests to prevent rate limit error
        setTimeout(postToPoshmark, 250);
      }
    });
  }
  
  // Listen for lazy load images with XHR override
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
  

  // Concatenate lazy loaded products to our productsToShare array
  function getLazyLoadIDs(data) {
    const $html = $(data.html);
    const lazyLoadedProducts = [...$html].map(itemNode => {
      return { 
        id: itemNode.querySelector('.tile').id, 
        name: itemNode.querySelector('.title').textContent
      };
    });
  
    console.log(`Found ${lazyLoadedProducts.length} more products`);
    productsToShare = productsToShare.concat(lazyLoadedProducts);
  
    console.log('productsToShare:', productsToShare);
    postToPoshmark();
  }
  
  // Call out captcha to user
  function triggerCaptcha() {
    document.querySelector('.share').click();
    setTimeout(() => {
      document.querySelector('#share-popup a').click();
    }, 1000);
  }
  
}