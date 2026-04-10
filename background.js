// background.js — MV3 service worker responsible for Notion API communication.

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

async function getNotionConfig() {
  const { notionToken, notionDatabaseId } = await chrome.storage.sync.get([
    "notionToken",
    "notionDatabaseId",
  ]);
  if (!notionToken || !notionDatabaseId) {
    throw new Error("Notion token or database ID is not configured.");
  }
  return { notionToken, notionDatabaseId };
}

function conversationToBlocks(conversation) {
  const blocks = [];
  for (const turn of conversation) {
    blocks.push({
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [{ type: "text", text: { content: turn.role || "message" } }],
      },
    });
    // Notion limits rich_text content to 2000 chars per block — chunk long text.
    const chunks = chunkText(turn.text || "", 1900);
    for (const chunk of chunks) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk } }],
        },
      });
    }
  }
  return blocks;
}

function chunkText(text, size) {
  if (!text) return [""];
  const out = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

const SOURCE_LABELS = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

async function createNotionPage(payload) {
  const { notionToken, notionDatabaseId } = await getNotionConfig();

  const title = (payload.title || "").trim() || "Untitled conversation";
  const sourceLabel = SOURCE_LABELS[payload.source] || payload.source || "Unknown";
  const conversationUrl = payload.url || null;

  const body = {
    parent: { database_id: notionDatabaseId },
    properties: {
      // Name: title property — conversation title
      Name: {
        title: [{ type: "text", text: { content: title } }],
      },
      // Source: rich_text property — platform label (ChatGPT / Gemini)
      Source: {
        rich_text: [{ type: "text", text: { content: sourceLabel } }],
      },
      // URL: url property — link to the original conversation
      URL: {
        url: conversationUrl,
      },
    },
    children: conversationToBlocks(payload.conversation || []),
  };

  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message = `Notion API ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.message) message = parsed.message;
      else if (parsed?.code) message = parsed.code;
    } catch (_) {
      // Not JSON — fall back to raw text snippet.
      if (errText) message = errText.slice(0, 200);
    }
    if (res.status === 401) message = "Invalid Notion token (401 Unauthorized)";
    else if (res.status === 404) message = "Database not found or not shared with integration (404)";
    throw new Error(message);
  }
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SAVE_TO_NOTION") return false;

  createNotionPage(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => {
      console.error("[LLM-to-Notion] background error:", err);
      sendResponse({ ok: false, error: err.message });
    });

  // Return true to keep the message channel open for the async response.
  return true;
});
