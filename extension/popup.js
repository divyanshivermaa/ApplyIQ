// simple Hindi: popup ka kaam = active tab ko message bhejna aur jo data aaye wo form me bharna

const $ = (id) => document.getElementById(id);

let resumeSlot = "1";

function safeStr(v) {
  if (v == null) return "";
  try {
    return typeof v === "string" ? v : String(v);
  } catch {
    return "";
  }
}

function getField(obj, key) {
  if (!obj || typeof obj !== "object") return "";
  try {
    return safeStr(obj[key]);
  } catch {
    return "";
  }
}

function setErr(msg) {
  const node = $("err");
  if (node) node.textContent = msg || "";
}
function setStatus(msg) {
  const node = $("status");
  if (node) node.textContent = msg || "-";
}

async function getToken() {
  try {
    const data = await chrome.storage.local.get(["auth", "jwtToken", "token"]);
    if (data?.auth?.token) return String(data.auth.token);
    if (data?.jwtToken) return String(data.jwtToken);
    if (data?.token) return String(data.token);
  } catch {}
  return "";
}

function platformFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

async function submitApplication(payload, token) {
  const res = await fetch("http://127.0.0.1:8000/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let data = null;
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    throw new Error(data?.detail || raw || "Submit failed");
  }

  return data;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.addEventListener("DOMContentLoaded", () => {
  const resumeSelect = $("resumeSlot");

  chrome.storage.local.get(["resumeSlot"], (result) => {
    if (result?.resumeSlot) {
      resumeSlot = String(result.resumeSlot);
      if (resumeSelect) resumeSelect.value = resumeSlot;
    }
  });

  if (resumeSelect) {
    resumeSelect.addEventListener("change", (e) => {
      resumeSlot = e.target?.value || "1";
      chrome.storage.local.set({ resumeSlot });
    });
  }
});

function fillForm(data) {
  const safe = (data && typeof data === "object") ? data : null;

  const jobUrl = $("jobUrl");
  const roleTitle = $("roleTitle");
  const company = $("company");
  const location = $("location");
  const jobType = $("jobType");
  const workMode = $("workMode");
  const selectedText = $("selectedText");

  if (jobUrl) jobUrl.value = getField(safe, "url");
  if (roleTitle) roleTitle.value = getField(safe, "role_title");
  if (company) company.value = getField(safe, "company_name");
  if (location) location.value = getField(safe, "location");
  if (jobType) jobType.value = getField(safe, "job_type");
  if (workMode) workMode.value = getField(safe, "work_mode");
  if (selectedText) selectedText.value = getField(safe, "selectedText");
}

function sendCapture(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "CAPTURE" }, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve({ ok: true, resp });
      }
    });
  });
}

async function injectContent(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "INJECT_CONTENT_SCRIPT", tabId }, (r) => {
      resolve(r);
    });
  });
}

$("btnCapture").addEventListener("click", async () => {
  setErr("");
  setStatus("Capturing...");

  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("-");
    setErr("No active tab found.");
    return;
  }

  // 1) try direct message
  let r = await sendCapture(tab.id);

  // 2) if failed, inject then retry
  if (!r.ok) {
    const inj = await injectContent(tab.id);
    if (!inj?.ok) {
      setStatus("-");
      setErr("Capture failed: " + (inj?.error || r.error));
      return;
    }
    r = await sendCapture(tab.id);
  }

  if (!r.ok || !r.resp) {
    setStatus("-");
    setErr("Capture failed: " + (r.error || "Unknown error"));
    return;
  }

  const captureResp = r.resp;
  if (!captureResp?.ok || !captureResp?.data || typeof captureResp.data !== "object") {
    setStatus("-");
    setErr("Capture failed: " + (captureResp?.error || "Invalid capture response"));
    return;
  }

  try {
    fillForm(captureResp?.data);
  } catch (e) {
    setStatus("-");
    setErr("Capture render failed: " + String(e));
    return;
  }
  setStatus("Captured from current page");
});

// Submit placeholder (your backend call can be added here)
$("btnSubmit").addEventListener("click", async () => {
  setErr("");
  setStatus("Submitting...");

  const jobUrl = safeStr($("jobUrl")?.value).trim();
  const roleTitle = safeStr($("roleTitle")?.value).trim();
  const companyName = safeStr($("company")?.value).trim();

  if (!jobUrl) {
    setStatus("-");
    setErr("Job URL is required.");
    return;
  }

  const token = await getToken();
  if (!token) {
    setStatus("-");
    setErr("No auth token found. Save token first.");
    return;
  }

  const payload = {
    company_name: companyName,
    role_title: roleTitle,
    job_url: jobUrl,
    platform: platformFromUrl(jobUrl),
    current_stage: "CAPTURED",
    resume_slot: Number(resumeSlot),
  };

  try {
    const data = await submitApplication(payload, token);
    setStatus(data?.id ? `Submitted (id=${data.id})` : "Submitted");
    setErr("");
  } catch (e) {
    setStatus("-");
    setErr(String(e?.message || e));
  }
});

window.addEventListener("error", (e) => {
  setStatus("-");
  setErr("Popup error: " + (e?.message || "Unknown"));
});

window.addEventListener("unhandledrejection", (e) => {
  setStatus("-");
  const reason = e?.reason ? String(e.reason) : "Unknown";
  setErr("Unhandled promise: " + reason);
  e.preventDefault();
});
