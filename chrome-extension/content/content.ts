import { detectActiveChapter } from './detectors/detector-engine';
import { ExtensionMessage } from '../shared/messages';

let lastSentChapter: number | null = null;
let lastSentSeries: string | null = null;

async function runDetection() {
  const context = await detectActiveChapter(document, window.location.href);
  if (!context) return;

  // Debounce duplicate broadcasts
  if (context.chapterNumber === lastSentChapter && context.seriesSlug === lastSentSeries) {
    return;
  }

  lastSentChapter = context.chapterNumber;
  lastSentSeries = context.seriesSlug;

  const msg: ExtensionMessage = {
    type: 'CHAPTER_DETECTED',
    payload: context
  };

  try {
    chrome.runtime.sendMessage(msg);
    console.log(`[OmniLore Reader] Identified: ${context.seriesTitle} Ch. ${context.chapterNumber} (Confidence: ${Math.round(context.confidence * 100)}%)`);
  } catch (err) {
    // Service worker may be waking up
  }
}

// Initial detection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runDetection);
} else {
  runDetection();
}

// Listen for text selections for "Who is this?" contextual lookup
document.addEventListener('mouseup', () => {
  const selection = window.getSelection()?.toString().trim();
  if (selection && selection.length > 1 && selection.length < 50) {
    chrome.runtime.sendMessage({
      type: 'WHO_IS_THIS',
      payload: { query: selection }
    }).catch(() => {});
  }
});

// Observe URL and title changes in single-page apps (SPA readers like MangaPlus)
let previousUrl = window.location.href;
let previousTitle = document.title;

const observer = new MutationObserver(() => {
  const urlChanged = window.location.href !== previousUrl;
  const titleChanged = document.title !== previousTitle;

  if (urlChanged || titleChanged) {
    previousUrl = window.location.href;
    previousTitle = document.title;
    setTimeout(runDetection, 300);
    setTimeout(runDetection, 1000);
  }
});

observer.observe(document, { subtree: true, childList: true });
