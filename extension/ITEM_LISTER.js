
var title = document.querySelector('input[placeholder="What are you selling? (required)"]');
title.value = `Shirt ${(Math.random() * 100).toFixed(0)}`;
title.dispatchEvent(new Event('input'));


var desc = document.querySelector('textarea');
desc.value = 'This lightly worn sweater is perfect for the upcoming holiday season! The fabric is lightweight and breathable and not stuff at all!';
desc.dispatchEvent(new Event('input'));


document.querySelector('.navigation--horizontal__tab:nth-child(2) a').click();
setTimeout(function() {
  document.querySelector('.dropdown__menu__item:nth-child(7) a[data-et-name=category]').click();

  setTimeout(function() {
    document.querySelector('.d--fl li:nth-child(4) button').click();

    var originalPrice = document.querySelector('input[data-vv-name=originalPrice]');
    originalPrice.value = '50';
    originalPrice.dispatchEvent(new Event('input'));

    var listingPrice = document.querySelector('input[data-vv-name=listingPrice]');
    listingPrice.value = '15';
    listingPrice.dispatchEvent(new Event('input'));

    document.querySelector('button[data-et-name=next]').click();
    setTimeout(function() {
      document.querySelector('button[data-et-name=list_item]').click();
    }, 350);
  }, 250);
}, 250);



