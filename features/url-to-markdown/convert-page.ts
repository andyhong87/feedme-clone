import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

import { isHttpUrl } from "./is-http-url";

export type ConvertFailure = "invalid-url" | "fetch-failed" | "not-html" | "empty-content";

export type ConvertResult =
  | { ok: true; title: string; author: string; markdown: string }
  | { ok: false; reason: ConvertFailure };

type ConvertDeps = { fetch?: typeof fetch };

const FETCH_TIMEOUT_MS = 15_000;
// 이보다 짧으면 차단 안내나 빈 껍데기 페이지로 보고 본문이 없는 것으로 처리한다.
const MIN_MARKDOWN_LENGTH = 80;

export async function convertPage(
  url: string,
  deps: ConvertDeps = {}
): Promise<ConvertResult> {
  if (!isHttpUrl(url)) return { ok: false, reason: "invalid-url" };

  const fetchPage = deps.fetch ?? fetch;
  let response: Response;
  try {
    response = await fetchPage(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; UrlToMarkdown/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "fetch-failed" };
  }
  if (!response.ok) return { ok: false, reason: "fetch-failed" };

  const contentType = response.headers.get("content-type") ?? "";
  if (!/html/i.test(contentType)) return { ok: false, reason: "not-html" };

  let html: string;
  try {
    html = await response.text();
  } catch {
    return { ok: false, reason: "fetch-failed" };
  }

  // defuddle은 jsdom 30과 함께 쓰면 셀렉터 길이 제한으로 실패해 linkedom을 쓴다.
  const { document } = parseHTML(html);
  const page = await Defuddle(document, url, { markdown: true });

  const markdown = page.content.trim();
  if (markdown.length < MIN_MARKDOWN_LENGTH) {
    return { ok: false, reason: "empty-content" };
  }

  return {
    ok: true,
    title: page.title,
    author: page.author,
    markdown,
  };
}
