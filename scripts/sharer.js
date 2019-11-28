function ppStopSharer() {
  window.ppHaltPosting = true;
  document.body.classList.remove('pp-processing');
  const endMessage = `<div class="msg"><span class="log-body">Following paused.</span></div>`;
  window.ppMessage(endMessage);
}

function ppResumeSharing(options) {
  window.ppHaltPosting = false;
  document.body.classList.add('pp-processing');
  window.postToPoshmark(options);
}

function ppStartSharer(options) {
  console.log('options', options);

  document.body.classList.add('pp-processing');


  // If sharing order is reversed then first force lazy load
  //let numListings = +document.querySelector('#closet-info .count').innerText;
  let numListings = 200;

  if (options.reverseSharing) {
    window.ppMessage('<div class="msg"><span class="log-body">Gathering items in closet - Please wait...</span></div>');
  }

  // Save all product IDs and titles
  let productsToShare = [...document.querySelectorAll('.tile')].map(node => {
    return { id: node.id, name: node.querySelector('.title').textContent }
  });
  
  console.log(productsToShare.length);

  // Save flag to halt/resume posting
  window.ppHaltPosting = false;
  let numProductsShared = 0;
  let thresholdMet = false;
  

  window.postToPoshmark = (options) => {
    let partyID = null;

    if (options.shareToParty) {
      const eventEl = document.querySelector('#share-popup a[eventid]');

      if (!eventEl) {
        return window.ppMessage('<div class="msg error"><span class="log-body">No party found.</span></div>');
      }

      partyID = eventEl.getAttribute('eventid');
    }


    if (options.reverseSharing && !thresholdMet) {
      console.log('reverse sharing');
      (function checkAllProductsLoaded() {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(function() {
          console.log('AutoScrolling', document.querySelectorAll('.tile').length);
          if (document.querySelectorAll('.tile').length < numListings) {
            checkAllProductsLoaded();
          } else {
            thresholdMet = true;
            return proceed();
          }
        }, 1500);
      })();
    } else proceed();

    function proceed() {
      console.log('proceed');

      // If there are no more products then autoscroll down to trigger lazy load
      if (!productsToShare.length && !options.reverseSharing) {
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
      const method = options.reverseSharing ? 'pop' : 'shift';
      const productToSend = productsToShare[method]();

      let additionalQuery = options.shareToParty ? `&event_id=${partyID}` : '';

      $.ajax({
        type: 'POST',
        url: `https://poshmark.com/listing/share?post_id=${productToSend.id}${additionalQuery}`,
        success(response) {
          
          numProductsShared++;
          console.log(response, productsToShare.length, productToSend.name);

          if (window.ppHaltPosting) {
            const endMessage = `<div class="msg"><span class="log-body">Sharing paused.</span></div>`;
            window.ppMessage(endMessage);
            return;
          }

          const logMessage = `<div class="msg"><span class="log-num">${numProductsShared}</span> <span class="log-body">Shared ${productToSend.name}</span></div>`;
          window.ppMessage(logMessage);

          // Stagger requests to prevent rate limit error
          setTimeout(window.postToPoshmark.bind(null, options), 250);
        },
        error(xhr, status, error) {
          console.log('xhr', xhr);
          console.log('status', status);
          console.log('error', error);

          window.ppHaltPosting = true;

          if (xhr.status === 429) {
            const rateLimitMessage = `<div class="msg error"><span class="log-body">Rate limit exceed - Restarting in 30 seconds...</span></div>`;
            window.ppMessage(rateLimitMessage);
            setTimeout(() => {
              window.ppHaltPosting = false;
              window.postToPoshmark(options);
            }, 30000);
          } else if (xhr.status === 403) {
            document.body.classList.remove('pp-processing');
            triggerCaptcha();
            const botErrorMessage = `<div class="msg error"><span class="log-body">Sharing stopped by site - Captcha required.</span></div>`;
            return window.ppMessage(botErrorMessage);
          }
        }
      });

    }

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
    window.postToPoshmark(options);
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
  window.postToPoshmark(options);
  
}