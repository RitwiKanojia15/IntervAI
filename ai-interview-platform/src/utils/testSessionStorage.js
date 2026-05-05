export const ACTIVE_TEST_STORAGE_KEY = "intervai-active-test-session";
export const TEST_RESULT_STORAGE_KEY = "intervai-last-test-result";

const parseStoredValue = (key, storage = sessionStorage) => {
  const rawValue = storage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    storage.removeItem(key);
    return null;
  }
};

export const getActiveTestSession = () => parseStoredValue(ACTIVE_TEST_STORAGE_KEY);

export const saveActiveTestSession = (payload) => {
  sessionStorage.setItem(ACTIVE_TEST_STORAGE_KEY, JSON.stringify(payload));
};

export const clearActiveTestSession = () => {
  sessionStorage.removeItem(ACTIVE_TEST_STORAGE_KEY);
};

// Result is saved to both sessionStorage (for immediate use) and localStorage (for persistence)
export const getSavedTestResult = () =>
  parseStoredValue(TEST_RESULT_STORAGE_KEY) ||
  parseStoredValue(TEST_RESULT_STORAGE_KEY, localStorage);

export const saveTestResult = (payload) => {
  const serialized = JSON.stringify(payload);
  sessionStorage.setItem(TEST_RESULT_STORAGE_KEY, serialized);
  localStorage.setItem(TEST_RESULT_STORAGE_KEY, serialized);
};

export const clearSavedTestResult = () => {
  sessionStorage.removeItem(TEST_RESULT_STORAGE_KEY);
  localStorage.removeItem(TEST_RESULT_STORAGE_KEY);
};
