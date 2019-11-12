// Receive message from extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	// Extract recipe
	if (request.rsAction === 'extract') {
		(async () => {
			const src = chrome.extension.getURL('./scraper/integrations.js');
			const scrape = await import(src);
			// This returns a module - the default property is the actual function
			const recipe = scrape.default();
			recipe.scraped = true;
			sendResponse(recipe);
		})();
	}

	// We need to return true to get around this error: "The message port closed before a response was received."
	return true; 
});