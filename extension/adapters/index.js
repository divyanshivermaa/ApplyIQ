// extension/adapters/index.js

console.log("[II] adapters router loaded ✅");

window.runAdapters = function (data) {
  const host = location.hostname;

  if (host.includes("indeed.") && typeof window.adaptIndeed === "function") {
    return window.adaptIndeed();
  }

  return null;
};