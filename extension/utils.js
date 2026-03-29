// utils.js

// ✅ Simple Hindi comments: company name ko clean karne ka helper
function cleanCompanyName(raw) {
  // ✅ Agar blank/undefined aa gaya to safe return
  if (!raw) return "";

  // ✅ Extra spaces hatao
  let s = String(raw).trim();

  // ✅ Common noisy words remove (LinkedIn/boards)
  // ✅ "Actively Hiring", "Urgently Hiring", "Hiring" jaise suffix/prefix hata do
  s = s.replace(/\b(actively hiring|urgently hiring|hiring)\b/gi, "").trim();

  // ✅ Double spaces clean
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}

// ✅ Non-module style me global scope me available kar do
window.cleanCompanyName = cleanCompanyName;
