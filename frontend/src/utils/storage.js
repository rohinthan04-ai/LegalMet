// Browser-side helpers. The backend has no "load saved details" or "load saved evaluation" endpoint,
// so we keep a copy in the browser to survive page refreshes. This data only exists in THIS browser.

const DRAFT_PREFIX = "legalmet_draft_";
const EVAL_PREFIX = "legalmet_eval_";

// Review-page drafts: { original, values, saved }
export const draftStore = {
  load(imgId) {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_PREFIX + imgId));
    } catch {
      return null;
    }
  },
  save(imgId, draft) {
    try {
      localStorage.setItem(DRAFT_PREFIX + imgId, JSON.stringify(draft));
    } catch {
      /* storage full or blocked: the app still works, just without refresh protection */
    }
  },
};

// Last evaluation result per image + category (kept for this tab only)
export const evalCache = {
  load(imgId, cId) {
    try {
      return JSON.parse(sessionStorage.getItem(`${EVAL_PREFIX}${imgId}_${cId}`));
    } catch {
      return null;
    }
  },
  save(imgId, cId, result) {
    try {
      sessionStorage.setItem(`${EVAL_PREFIX}${imgId}_${cId}`, JSON.stringify(result));
    } catch {
      /* ignore */
    }
  },
  // Called when the inspector saves new details, because old evaluations no longer match them.
  clearImage(imgId) {
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith(`${EVAL_PREFIX}${imgId}_`))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      /* ignore */
    }
  },
};

// Called on logout so the next person on a shared computer cannot see leftover inspection data.
export function clearAllLocalData() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(DRAFT_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(EVAL_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
