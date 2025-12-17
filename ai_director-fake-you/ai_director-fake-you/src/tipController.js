// File: src/tipController.js
const fetch = require('node-fetch');
const config = require('config');
const path = require('path');

const storyController = require(path.join(__dirname, '..', 'src', 'storyController'));

let lastCheckTimestamp = new Date(0).toISOString();

// Fetches the latest tips for the given account
async function getTipsFromStreamElements() {
  const endpoint = `https://api.streamelements.com/kappa/v2/tips/${config.get('streamElements.accountId')}`;
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.get('streamElements.jwtToken')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem fetching the tips:", error);
  }
}

// Handles each individual tip
function handleTip(tip) {
  console.log('Processing tip:', tip);
  // Add further logic if needed
}

// Fetches and handles the tips
async function fetchAndHandleTips() {
  const tips = await getTipsFromStreamElements();
  if (tips && tips.length) {
    const newTips = lastCheckTimestamp
      ? tips.filter(tip => new Date(tip.createdAt) > lastCheckTimestamp)
      : tips;
    newTips.forEach(handleTip);
    if (newTips.length) {
      lastCheckTimestamp = newTips[0].createdAt;
    }
  } else {
    console.log('No new tips received.');
  }
}

// Initiates the monitoring of tips
function startTipMonitoring() {
  getTipsFromStreamElements().then(tips => {
    if (tips && tips.docs && tips.docs.length) {
      const newTips = tips.docs.filter(tip => tip.createdAt > lastCheckTimestamp);
      if (newTips.length > 0) {
        lastCheckTimestamp = newTips[0].createdAt;
        newTips.forEach(tip => {
          const requestData = {
            requestor_id: tip.donation.user.username,
            topic: tip.donation.message,
            isTipGenerated: true
          };
          storyController.suggestTopic(requestData);
        });
      } else {
        console.log('No new tips received.');
      }
    } else {
      console.log('No tips received.');
    }
  });
}

module.exports = { startTipMonitoring };
