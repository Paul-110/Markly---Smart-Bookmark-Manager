// Markly Extension Background Script
chrome.runtime.onInstalled.addListener(() => {
    console.log('Markly Extension installed');
});

// Listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveBookmark') {
        // Here we would call the Markly API
        // boilerplate for API call:
        /*
        fetch('https://your-deployed-app.com/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${request.token}`
          },
          body: JSON.stringify(request.bookmark)
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // async
        */

        // Simulate success for boilerplate
        setTimeout(() => {
            sendResponse({ success: true });
        }, 1000);
        return true;
    }
});
