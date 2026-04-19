const SESSION_STORAGE_KEY = "jhoom.session";

let cachedSession = loadInitialSession();
const listeners = new Set();

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadInitialSession() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

function persistSession() {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!cachedSession) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cachedSession));
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(cachedSession);
    } catch {
      // Ignore listener failures so session updates remain reliable.
    }
  });
}

export function saveSession(session) {
  cachedSession = {
    token: session.token,
    user: session.user ?? null,
  };
  persistSession();
  notifyListeners();
  return cachedSession;
}

export function getSession() {
  return cachedSession;
}

export function getAuthToken() {
  return cachedSession?.token ?? "";
}

export function getCurrentUser() {
  return cachedSession?.user ?? null;
}

export function updateCurrentUser(userPatch) {
  if (!cachedSession) {
    return null;
  }

  cachedSession = {
    ...cachedSession,
    user: {
      ...(cachedSession.user ?? {}),
      ...userPatch,
    },
  };
  persistSession();
  notifyListeners();
  return cachedSession.user;
}

export function clearSession() {
  cachedSession = null;
  persistSession();
  notifyListeners();
}

export function subscribeToSession(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
