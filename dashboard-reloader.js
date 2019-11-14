var extensionsManager = document.querySelector('extensions-manager');
var viewManager = extensionsManager.shadowRoot.querySelector('#viewManager');
var itemsList = viewManager.querySelector('#items-list');
var poshmarkCard = itemsList.shadowRoot.querySelector('#lkegafbffjiigdfibgpdellgpphlmeca');
var refreshButton = poshmarkCard.shadowRoot.querySelector('#dev-reload-button');

var interval = setInterval(() => {
  refreshButton.click();
}, 1000);
