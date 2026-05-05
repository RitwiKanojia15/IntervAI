const ACTIVE_LIVE_TEST_KEY = "intervai-active-live-test";
const LIVE_TEST_RESULT_KEY = "intervai-live-test-result";

const safeRead = (storageKey) => {
  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
};

const safeWrite = (storageKey, payload) => {
  window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
};

export const getActiveLiveTest = () => safeRead(ACTIVE_LIVE_TEST_KEY);
export const saveActiveLiveTest = (payload) => safeWrite(ACTIVE_LIVE_TEST_KEY, payload);
export const clearActiveLiveTest = () => window.sessionStorage.removeItem(ACTIVE_LIVE_TEST_KEY);

export const getLiveTestResult = () => safeRead(LIVE_TEST_RESULT_KEY);
export const saveLiveTestResult = (payload) => safeWrite(LIVE_TEST_RESULT_KEY, payload);
export const clearLiveTestResult = () => window.sessionStorage.removeItem(LIVE_TEST_RESULT_KEY);
