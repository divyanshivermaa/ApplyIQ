const $ = (id) => document.getElementById(id);
const API_BASES = ["http://127.0.0.1:8000", "http://localhost:8000"];

function setErr(msg) {
  const n = $("err");
  if (n) n.textContent = msg || "";
}

function setStatus(msg) {
  const n = $("status");
  if (n) n.textContent = msg || "-";
}

function readKey(obj, key) {
  if (!obj || typeof obj !== "object") return "";
  try {
    const v = Reflect.get(obj, key);
    if (v == null) return "";
    return typeof v === "string" ? v : String(v);
  } catch {
    return "";
  }
}

function fillForm(data) {
  const d = (data && typeof data === "object") ? data : null;

  const map = [
    ["jobUrl", "url"],
    ["roleTitle", "role_title"],
    ["company", "company_name"],
    ["location", "location"],
    ["jobType", "job_type"],
    ["workMode", "work_mode"],
    ["selectedText", "selectedText"]
  ];

  for (const [id, key] of map) {
    const el = $(id);
    if (!el) continue;
    el.value = readKey(d, key);
  }
}

function setTokenStatus(msg) {
  const node = $("tokenStatus");
  if (node) node.textContent = msg || "";
}

async function loadResumeSlot() {
  const node = $("resumeSlot");
  if (!node) return;
  try {
    const data = await chrome.storage.local.get(["resumeSlot"]);
    if (data?.resumeSlot) {
      node.value = String(data.resumeSlot);
    }
  } catch {}
}

function saveResumeSlot(value) {
  chrome.storage.local.set({ resumeSlot: value });
}

async function saveToken(token) {
  const clean = (token || "").trim();
  if (!clean) return false;
  await chrome.storage.local.set({
    auth: { token: clean, token_type: "bearer" },
    jwtToken: clean
  });
  return true;
}

async function clearToken() {
  await chrome.storage.local.remove(["auth", "jwtToken", "token"]);
}

async function refreshTokenStatus() {
  const token = await getToken();
  if (token) setTokenStatus(`Token saved (${token.slice(0, 10)}...)`);
  else setTokenStatus("No token saved");
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

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
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

function injectContent(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "INJECT_CONTENT_SCRIPT", tabId }, (r) => {
      resolve(r || { ok: false, error: "Inject failed" });
    });
  });
}

async function onCapture() {
  setErr("");
  setStatus("Capturing...");

  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("-");
    setErr("No active tab found.");
    return;
  }

  let r = await sendCapture(tab.id);
  if (!r.ok) {
    const inj = await injectContent(tab.id);
    if (!inj?.ok) {
      setStatus("-");
      setErr("Capture failed: " + (inj?.error || r.error || "inject failed"));
      return;
    }
    r = await sendCapture(tab.id);
  }

  const captureResp = r?.resp;
  if (!r.ok || !captureResp || captureResp.ok !== true || !captureResp.data || typeof captureResp.data !== "object") {
    setStatus("-");
    setErr("Capture failed: " + (captureResp?.error || r?.error || "Invalid capture response"));
    return;
  }

  fillForm(captureResp.data);
  setStatus("Captured from current page");
}

async function onSubmit() {
  setErr("");
  setStatus("Submitting...");

  const job_url = readKey({ v: $("jobUrl")?.value }, "v").trim();
  const role_title = readKey({ v: $("roleTitle")?.value }, "v").trim();
  const company_name = readKey({ v: $("company")?.value }, "v").trim();
  const location = readKey({ v: $("location")?.value }, "v").trim();
  const job_type = readKey({ v: $("jobType")?.value }, "v").trim();
  const work_mode = readKey({ v: $("workMode")?.value }, "v").trim();
  const resume_slot_raw = readKey({ v: $("resumeSlot")?.value }, "v").trim();
  const resume_slot = resume_slot_raw ? Number(resume_slot_raw) : 1;

  if (!job_url) {
    setStatus("-");
    setErr("Job URL is required.");
    return;
  }

  const typedToken = readKey({ v: $("tokenInput")?.value }, "v").trim();
  if (typedToken) {
    await saveToken(typedToken);
    const inp = $("tokenInput");
    if (inp) inp.value = "";
    await refreshTokenStatus();
  }

  const token = await getToken();
  if (!token) {
    setStatus("-");
    setErr("No auth token found. Paste token and click Save token.");
    return;
  }

  const payload = {
    company_name: company_name || "Unknown",
    role_title: role_title || "Unknown",
    job_url,
    platform: platformFromUrl(job_url),
    location: location || null,
    job_type: job_type || null,
    work_mode: work_mode || null,
    current_stage: "CAPTURED",
    resume_slot
  };

  let lastErr = "";
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const raw = await res.text();
      if (!res.ok) {
        setStatus("-");
        setErr(`Submit failed (${res.status}) on ${base}: ${raw || "Unknown backend error"}`);
        return;
      }

      let parsed = null;
      try { parsed = JSON.parse(raw); } catch {}
      setStatus(parsed?.id ? `Submitted (id=${parsed.id})` : "Submitted");
      setErr("");
      return;
    } catch (e) {
      lastErr = String(e);
    }
  }

  setStatus("-");
  setErr(
    "Submit failed: backend unreachable on 127.0.0.1:8000 and localhost:8000.\n" +
    "Start backend: uvicorn app.main:app --host 127.0.0.1 --port 8000\n" +
    `Last error: ${lastErr}`
  );
}

const btnCapture = $("btnCapture");
if (btnCapture) btnCapture.addEventListener("click", () => {
  onCapture().catch((e) => {
    setStatus("-");
    setErr("Capture failed: " + String(e));
  });
});

const btnSubmit = $("btnSubmit");
if (btnSubmit) btnSubmit.addEventListener("click", () => {
  onSubmit().catch((e) => {
    setStatus("-");
    setErr("Submit failed: " + String(e));
  });
});

const resumeSlotSelect = $("resumeSlot");
if (resumeSlotSelect) resumeSlotSelect.addEventListener("change", (e) => {
  const value = readKey({ v: e?.target?.value }, "v").trim() || "1";
  resumeSlotSelect.value = value;
  saveResumeSlot(value);
});

const btnSaveToken = $("btnSaveToken");
if (btnSaveToken) btnSaveToken.addEventListener("click", () => {
  (async () => {
    setErr("");
    const input = $("tokenInput");
    const token = readKey({ v: input?.value }, "v").trim();
    if (!token) {
      setErr("Paste token first.");
      return;
    }
    const ok = await saveToken(token);
    if (!ok) {
      setErr("Unable to save token.");
      return;
    }
    if (input) input.value = "";
    await refreshTokenStatus();
    setStatus("Token saved");
  })().catch((e) => {
    setErr("Token save failed: " + String(e));
  });
});

const btnClearToken = $("btnClearToken");
if (btnClearToken) btnClearToken.addEventListener("click", () => {
  (async () => {
    setErr("");
    await clearToken();
    await refreshTokenStatus();
    setStatus("Token cleared");
  })().catch((e) => {
    setErr("Token clear failed: " + String(e));
  });
});

window.addEventListener("error", (e) => {
  setStatus("-");
  setErr("Popup error: " + (e?.message || "Unknown"));
});

window.addEventListener("unhandledrejection", (e) => {
  setStatus("-");
  setErr("Unhandled promise: " + String(e?.reason || "Unknown"));
  e.preventDefault();
});

refreshTokenStatus().catch(() => {});
loadResumeSlot().catch(() => {});
