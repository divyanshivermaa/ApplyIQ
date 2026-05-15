// extension/adapters/index.js

console.log("[II] adapters router loaded ✅");

window.runAdapters = function (data) {
  const host = location.hostname;

  if (host.includes("linkedin")) {
    if (typeof window.linkedInAdapter === "function") {
      return window.linkedInAdapter();
    }
    return null;
  }

  if (host.includes("indeed.") && typeof window.adaptIndeed === "function") {
    return window.adaptIndeed();
  }

  return null;
};