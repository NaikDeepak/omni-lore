import { ExtensionMessage, ExtensionState } from '../shared/messages';
import { ExtensionTemporalClient } from '../temporal/temporal-client';
import { SUPPORTED_SERIES, DEFAULT_SHIELD_LEVEL } from '../shared/constants';

// Configure side panel to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err: unknown) => {
  console.error('[OmniLore SW] setPanelBehavior error', err);
});

// Setup context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'omnilore-who-is-this',
    title: 'OmniLore: Who is "%s"?',
    contexts: ['selection']
  });
  console.log('[OmniLore Reader] Extension installed and ready.');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
  if (info.menuItemId === 'omnilore-who-is-this' && info.selectionText) {
    const query = info.selectionText.trim();
    await chrome.storage.session.set({ selectedCharacterLookup: query });

    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
    }

    // Broadcast lookup to side panel
    chrome.runtime.sendMessage({
      type: 'WHO_IS_THIS',
      payload: { query }
    }).catch(() => {});
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  (async () => {
    const tabId = sender.tab?.id ?? (message as any).tabId;

    if (message.type === 'CHAPTER_DETECTED') {
      const context = message.payload;
      const seriesSlug = context.seriesSlug;
      const ch = context.chapterNumber;

      // Generate temporal snapshot
      const snapshot = ExtensionTemporalClient.getSnapshot(seriesSlug, ch, DEFAULT_SHIELD_LEVEL);

      const state: ExtensionState = {
        detectedContext: context,
        activeSeriesSlug: seriesSlug,
        activeChapterNumber: ch,
        shieldLevel: DEFAULT_SHIELD_LEVEL,
        snapshot,
        sourceUrl: context.url
      };

      await chrome.storage.session.set({
        currentState: state,
        [`tab_${tabId}`]: state
      });

      // Update badge
      if (tabId) {
        chrome.action.setBadgeText({ tabId, text: String(ch) }).catch(() => {});
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#f59e0b' }).catch(() => {});
      }

      sendResponse({ success: true, state });
    }

    else if (message.type === 'GET_CURRENT_STATE') {
      const data = await chrome.storage.session.get(['currentState', 'selectedCharacterLookup']);
      const lookup = data.selectedCharacterLookup ?? null;

      let state: ExtensionState = data.currentState;
      if (!state) {
        // Fallback default
        const defaultSeries = SUPPORTED_SERIES[0].slug;
        const defaultCh = 150;
        state = {
          detectedContext: null,
          activeSeriesSlug: defaultSeries,
          activeChapterNumber: defaultCh,
          shieldLevel: DEFAULT_SHIELD_LEVEL,
          snapshot: ExtensionTemporalClient.getSnapshot(defaultSeries, defaultCh, DEFAULT_SHIELD_LEVEL)
        };
      }

      if (lookup) {
        state.selectedCharacterLookup = lookup;
        await chrome.storage.session.remove('selectedCharacterLookup');
      }

      sendResponse({ state });
    }

    else if (message.type === 'OVERRIDE_CHAPTER') {
      const { seriesSlug, chapterNumber } = message.payload;
      const data = await chrome.storage.session.get('currentState');
      const current = data.currentState || {};
      const shield = current.shieldLevel || DEFAULT_SHIELD_LEVEL;

      const snapshot = ExtensionTemporalClient.getSnapshot(seriesSlug, chapterNumber, shield);
      const updatedState: ExtensionState = {
        ...current,
        activeSeriesSlug: seriesSlug,
        activeChapterNumber: chapterNumber,
        snapshot
      };

      await chrome.storage.session.set({ currentState: updatedState });
      sendResponse({ state: updatedState });
    }

    else if (message.type === 'SET_SHIELD_LEVEL') {
      const { level } = message.payload;
      const data = await chrome.storage.session.get('currentState');
      const current = data.currentState;
      if (current) {
        const snapshot = ExtensionTemporalClient.getSnapshot(
          current.activeSeriesSlug,
          current.activeChapterNumber,
          level
        );
        const updatedState: ExtensionState = {
          ...current,
          shieldLevel: level,
          snapshot
        };
        await chrome.storage.session.set({ currentState: updatedState });
        sendResponse({ state: updatedState });
      }
    }
  })();

  return true; // Keep asynchronous channel open
});
