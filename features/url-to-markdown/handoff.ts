export type LlmService = "chatgpt" | "claude";

export type Handoff =
  | { mode: "url"; href: string }
  | { mode: "clipboard"; href: string; text: string };

// 쿼리로 입력창을 채우는 새 대화 주소. 서비스가 받아 주는 길이는 확인하지 못해 보수적으로 잡는다.
const NEW_CHAT_URL: Record<LlmService, string> = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
};
const MAX_HREF_LENGTH = 8000;

export function buildHandoff(input: {
  service: LlmService;
  prompt: string;
  markdown: string;
}): Handoff {
  const base = NEW_CHAT_URL[input.service];
  const text = input.prompt ? `${input.prompt}\n\n${input.markdown}` : input.markdown;
  const href = `${base}?q=${encodeURIComponent(text)}`;

  // 한글은 인코딩하면 글자당 약 9자로 늘어나므로 글자 수가 아니라 인코딩된 주소 길이로 판단한다.
  if (href.length <= MAX_HREF_LENGTH) return { mode: "url", href };
  return { mode: "clipboard", href: base, text };
}

export function markdownFileName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${slug || "page"}.md`;
}
