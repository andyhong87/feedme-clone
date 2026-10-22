// @vitest-environment node
import { describe, expect, test } from "vitest";

import { convertPage } from "./convert-page";

const ARTICLE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Why plain text outlasts every app | Example Blog</title>
    <meta property="og:title" content="Why plain text outlasts every app" />
    <meta name="author" content="Maya Lindqvist" />
  </head>
  <body>
    <nav><a href="/">Home</a><a href="/about">About</a></nav>
    <article>
      <h1>Why plain text outlasts every app</h1>
      <p>Every few years a note-taking app promises to hold your thinking forever. Every few years it shuts down, changes its pricing, or quietly drops the export button.</p>
      <h2>The three-decade test</h2>
      <p>Open a text file written in 1994 and it still opens. Try the same with a document saved by software from the same year and you will spend an afternoon hunting for a converter.</p>
      <ul>
        <li>Anyone can read the file without asking permission from a vendor, today or decades from now.</li>
        <li>A dozen unrelated programs already understand the format and will keep doing so.</li>
      </ul>
      <p>For the ideas you want to still have in thirty years, choose the format that asks nothing of the future.</p>
    </article>
    <footer>Subscribe to the newsletter</footer>
  </body>
</html>`;

function htmlResponse(body: string, init: ResponseInit = {}) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    ...init,
  });
}

describe("convertPage", () => {
  test("공개 블로그 글의 제목, 저자, 본문 Markdown을 돌려준다", async () => {
    const result = await convertPage("https://blog.example.com/plain-text", {
      fetch: async () => htmlResponse(ARTICLE_HTML),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toBe("Why plain text outlasts every app");
    expect(result.author).toBe("Maya Lindqvist");
    expect(result.markdown).toContain("## The three-decade test");
    expect(result.markdown).toMatch(/^[-*] Anyone can read the file/m);
    expect(result.markdown).not.toContain("Subscribe to the newsletter");
  });

  test("http(s)가 아닌 주소는 가져오지 않고 invalid-url로 끝난다", async () => {
    let called = false;
    const result = await convertPage("ftp://example.com/file", {
      fetch: async () => {
        called = true;
        return htmlResponse(ARTICLE_HTML);
      },
    });

    expect(result).toEqual({ ok: false, reason: "invalid-url" });
    expect(called).toBe(false);
  });

  test("접근 차단(403)과 네트워크 오류는 fetch-failed로 구분된다", async () => {
    const blocked = await convertPage("https://www.example.com/a", {
      fetch: async () => htmlResponse("Please enable JS", { status: 403 }),
    });
    const offline = await convertPage("https://www.example.com/b", {
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    expect(blocked).toEqual({ ok: false, reason: "fetch-failed" });
    expect(offline).toEqual({ ok: false, reason: "fetch-failed" });
  });

  test("HTML이 아닌 응답은 not-html로 끝난다", async () => {
    const result = await convertPage("https://www.example.com/report.pdf", {
      fetch: async () =>
        new Response("%PDF-1.7", {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
    });

    expect(result).toEqual({ ok: false, reason: "not-html" });
  });

  test("본문이 사실상 비어 있으면 empty-content로 끝난다", async () => {
    const result = await convertPage("https://app.example.com/dashboard", {
      fetch: async () =>
        htmlResponse(
          "<html><head><title>Dashboard</title></head><body><div id='root'></div><noscript>Enable JavaScript</noscript></body></html>"
        ),
    });

    expect(result).toEqual({ ok: false, reason: "empty-content" });
  });
});
