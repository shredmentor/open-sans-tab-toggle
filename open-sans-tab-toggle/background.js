const CSS_FILE = 'open-sans.css';
const key = tabId => `tab-${tabId}`;

async function setIndicator(tabId, enabled) {
  await chrome.action.setBadgeText({ tabId, text: enabled ? 'ON' : '' });
  if (enabled) {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#167a45' });
    await chrome.action.setTitle({ tabId, title: 'Open Sans ON: click to restore fonts' });
  } else {
    await chrome.action.setTitle({ tabId, title: 'Open Sans OFF: click to enable' });
  }
}

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  const id = tab.id;
  const entry = await chrome.storage.session.get(key(id));
  const enabled = Boolean(entry[key(id)]);
  try {
    if (enabled) {
      await chrome.scripting.removeCSS({ target: { tabId: id }, files: [CSS_FILE], origin: 'USER' });
    } else {
      await chrome.scripting.insertCSS({ target: { tabId: id }, files: [CSS_FILE], origin: 'USER' });
    }
    await chrome.storage.session.set({ [key(id)]: !enabled });
    await setIndicator(id, !enabled);
  } catch (error) {
    // Chrome forbids injection into some pages, including chrome:// and the Web Store.
    await chrome.action.setBadgeText({ tabId: id, text: 'ERR' });
    await chrome.action.setBadgeBackgroundColor({ tabId: id, color: '#b91c1c' });
    console.warn('Open Sans Tab Toggle:', error);
  }
});

// A full page navigation discards injected CSS, so discard the toggle state too.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'loading') return;
  await chrome.storage.session.remove(key(tabId));
  await setIndicator(tabId, false);
});
chrome.tabs.onRemoved.addListener(tabId => chrome.storage.session.remove(key(tabId)));
