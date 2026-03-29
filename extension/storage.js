// storage.js
export async function getAuth() {
  const data = await chrome.storage.local.get(["auth"]);
  return data.auth || null;
}

export async function setAuth(auth) {
  await chrome.storage.local.set({ auth });
}

export async function clearAuth() {
  await chrome.storage.local.remove(["auth"]);
}
