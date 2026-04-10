// content.js — injects a "Save to Notion" button and parses DOM to Markdown.

const BUTTON_ID = "llm-to-notion-save-btn";

function getHost() {
  const { hostname } = window.location;
  if (hostname.includes("chatgpt.com")) return "chatgpt";
  if (hostname.includes("gemini.google.com")) return "gemini";
  return null;
}

// 핵심 기능: HTML을 읽어서 마크다운(코드 블록, 리스트 등)으로 변환합니다.
function htmlToMarkdown(node) {
  if (!node) return "";
  let md = "";
  
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      md += child.textContent;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase();
      
      if (tag === 'pre') {
        // 코드 블록 추출
        const codeNode = child.querySelector('code');
        const codeText = codeNode ? codeNode.innerText : child.innerText;
        const langMatch = codeNode ? codeNode.className.match(/language-(\w+)/) : null;
        const lang = langMatch ? langMatch[1] : "";
        md += `\n\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
      } else if (tag === 'code') {
        // 인라인 코드 추출
        md += `\`${child.innerText}\``;
      } else if (tag === 'p' || tag === 'div') {
        md += `\n${htmlToMarkdown(child)}\n`;
      } else if (tag === 'ul' || tag === 'ol') {
        md += `\n${htmlToMarkdown(child)}\n`;
      } else if (tag === 'li') {
        // 불렛 포인트 유지
        md += `- ${htmlToMarkdown(child).trim()}\n`;
      } else if (tag === 'strong' || tag === 'b') {
        md += `**${htmlToMarkdown(child)}**`;
      } else {
        md += htmlToMarkdown(child);
      }
    }
  }
  // 불필요한 연속 줄바꿈 제거
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

function extractConversation(host) {
  if (host === "chatgpt") {
    const turns = document.querySelectorAll('[data-message-author-role]');
    return Array.from(turns).map((el) => {
      const role = el.getAttribute("data-message-author-role");
      // ChatGPT 답변은 .markdown 클래스 안에 담겨있습니다.
      const contentNode = el.querySelector('.markdown') || el;
      return {
        role: role,
        text: htmlToMarkdown(contentNode)
      };
    });
  }
  if (host === "gemini") {
    const turns = document.querySelectorAll("user-query, model-response");
    return Array.from(turns).map((el) => {
      const isUser = el.tagName.toLowerCase() === "user-query";
      const role = isUser ? "user" : "assistant";
      // Gemini 답변은 .message-content 클래스 안에 주로 담겨있습니다.
      const contentNode = isUser ? el : (el.querySelector('.message-content') || el);
      return {
        role: role,
        text: htmlToMarkdown(contentNode)
      };
    });
  }
  return [];
}

function createButton() {
  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.type = "button";
  btn.textContent = "Save to Notion";
  btn.className = "llm-to-notion-btn";
  btn.addEventListener("click", handleSaveClick);
  return btn;
}

function showToast(message, variant = "error") {
  const existing = document.getElementById("llm-to-notion-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "llm-to-notion-toast";
  toast.className = `llm-to-notion-toast llm-to-notion-toast--${variant}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function shortError(message) {
  if (!message) return "Unknown error";
  return message.length > 24 ? message.slice(0, 24) + "…" : message;
}

async function handleSaveClick() {
  const btn = document.getElementById(BUTTON_ID);
  const host = getHost();
  if (!host) return;

  const original = btn.textContent;
  btn.disabled = true;
  btn.title = "";
  btn.textContent = "Saving…";

  try {
    const conversation = extractConversation(host);
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_TO_NOTION",
      payload: {
        source: host,
        url: window.location.href,
        title: document.title,
        conversation,
        capturedAt: new Date().toISOString(),
      },
    });

    if (response?.ok) {
      btn.textContent = "Saved ✓";
      showToast("Saved to Notion", "success");
    } else {
      const errMsg = response?.error || "Unknown error";
      btn.textContent = `Failed: ${shortError(errMsg)}`;
      btn.title = errMsg;
      showToast(`Save failed — ${errMsg}`, "error");
      console.error("[LLM-to-Notion] save failed:", errMsg);
    }
  } catch (err) {
    const errMsg = err?.message || String(err);
    btn.textContent = `Error: ${shortError(errMsg)}`;
    btn.title = errMsg;
    showToast(`Error — ${errMsg}`, "error");
    console.error("[LLM-to-Notion] unexpected error:", err);
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = original;
      btn.title = "";
    }, 4000);
  }
}

function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;
  document.body.appendChild(createButton());
}

const observer = new MutationObserver(() => injectButton());
observer.observe(document.documentElement, { childList: true, subtree: true });

injectButton();