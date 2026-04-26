const ACCESS_TOKEN_KEY = "codeguide_access_token";
const REFRESH_TOKEN_KEY = "codeguide_refresh_token";
const USER_KEY = "codeguide_user";

export function saveAuthData(authData) {
  localStorage.setItem(ACCESS_TOKEN_KEY, authData.tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
}

export function getSavedUser() {
  const savedUser = localStorage.getItem(USER_KEY);

  if (!savedUser) {
    return null;
  }

  return JSON.parse(savedUser);
}

export function clearAuthData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}