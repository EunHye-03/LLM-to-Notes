// popup.js — stores Notion credentials in chrome.storage.sync.

const tokenEl = document.getElementById("token");
const dbEl = document.getElementById("db");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

async function load() {
  const { notionToken = "", notionDatabaseId = "" } = await chrome.storage.sync.get([
    "notionToken",
    "notionDatabaseId",
  ]);
  tokenEl.value = notionToken;
  dbEl.value = notionDatabaseId;
}

function showStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#dc2626" : "#16a34a";
}

saveBtn.addEventListener("click", async () => {
  const token = tokenEl.value.trim();
  const db = dbEl.value.trim();
  if (!token || !db) {
    showStatus("Token and Database ID are required.", true);
    return;
  }
  await chrome.storage.sync.set({
    notionToken: token,
    notionDatabaseId: db,
  });
  showStatus("Saved.");
  setTimeout(() => (statusEl.textContent = ""), 1500);
});

load();
