// simple Hindi: confidence ko rank me convert karte hain
export const CONF_RANK = { none: 0, low: 1, medium: 2, high: 3 };

export function confRank(v) {
  return CONF_RANK[v || "none"] ?? 0;
}

// simple Hindi: naya value tabhi override kare jab naya confidence zyada ho
// ya old empty ho to safe return
export function shouldOverride(oldConf, newConf, oldVal, newVal) {
  if (!newVal) return false;
  if (!oldVal) return true;
  return confRank(newConf) > confRank(oldConf);
}
