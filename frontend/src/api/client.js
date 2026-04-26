const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const accessToken = localStorage.getItem("codeguide_access_token");
  const skipAuth = options.skipAuth === true;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken && !skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.full_name?.[0] ||
      "Request failed.";

    throw new Error(message);
  }

  return data;
}