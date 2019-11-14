function ppStopSharer() {
  window.ppHaltPosting = true;
  document.body.classList.remove('pp-processing');
  const endMessage = `<div class="msg"><span class="log-body">Following paused.</span></div>`;
  window.ppMessage(endMessage);
}

function ppResumeSharing() {
  window.ppHaltPosting = false;
  document.body.classList.add('pp-processing');
  window.postToPoshmark();
}

function ppStartSharer() {
  document.body.classList.add('pp-processing');
  // Save all product IDs and titles
  let productsToShare = [...document.querySelectorAll('.tile')].map(node => {
    return { id: node.id, name: node.querySelector('.title').textContent }
  });
  
  // Save flag to halt/resume posting
  window.ppHaltPosting = false;
  let numProductsShared = 0;
  

  window.postToPoshmark = () => {
    // If there are no more products then autoscroll down to trigger lazy load
    if (!productsToShare.length) {
      console.log('AutoScrolling');
      window.scrollTo(0, document.body.scrollHeight);
      return setTimeout(() => {
        if (!productsToShare.length) {
          const endMessage = `<div class="msg callout"><span class="log-body">Finished sharing.</span></div>`;
          window.ppMessage(endMessage);
          document.body.classList.remove('pp-processing');
        }
      }, 4000);
    }
  
    // Use and remove the first product in the array
    const productToSend = productsToShare.shift();
    $.ajax({
      type: 'PUT',
      url: `https://poshmark.com/vm-rest/users/self/shared_posts/${productToSend.id}`,
      success(response) {
        
        numProductsShared++;
        console.log(response, productsToShare.length, productToSend.name);

        if (response.error) {
          window.ppHaltPosting = true;
          console.log('ERROR', response.error.errorType);

          if (response.error.errorType === 'SharePostRequestLimitExceededError') {
            const rateLimitMessage = `<div class="msg error"><span class="log-body">Rate limit exceed - Restarting in 30 seconds...</span></div>`;
            window.ppMessage(rateLimitMessage);
            setTimeout(() => {
              window.ppHaltPosting = false;
              window.postToPoshmark();
            }, 30000);
          } else if (response.error.errorType === 'SuspectedBotError') {
            document.body.classList.remove('pp-processing');
            triggerCaptcha();
            const botErrorMessage = `<div class="msg error"><span class="log-body">Sharing stopped by site - Captcha required.</span></div>`;
            return window.ppMessage(botErrorMessage);
          }
        }

        if (window.ppHaltPosting) {
          const endMessage = `<div class="msg"><span class="log-body">Sharing paused.</span></div>`;
          window.ppMessage(endMessage);
          return;
        }

        const logMessage = `<div class="msg"><span class="log-num">${numProductsShared}</span> <span class="log-body">Shared ${productToSend.name}</span></div>`;
        window.ppMessage(logMessage);

        // Stagger requests to prevent rate limit error
        setTimeout(window.postToPoshmark, 250);
      }
    });
  }
  
  // Listen for lazy load content with XHR override
  function listenForCategoryContent(cb) {
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.addEventListener('load', function() {
        if (this.readyState === 4 &&  /\/(category|closet)\//.test(url)) {
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
  
    productsToShare = productsToShare.concat(lazyLoadedProducts);
    window.postToPoshmark();
  }
  
  // Call out captcha to user
  function triggerCaptcha() {
    document.querySelector('.share').click();
    setTimeout(() => {
      document.querySelector('#share-popup a').click();
    }, 1000);
  }

  // Begin sequence
  listenForCategoryContent(getLazyLoadIDs);
  window.postToPoshmark();
  
}