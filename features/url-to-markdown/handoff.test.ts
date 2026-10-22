import { describe, expect, test } from "vitest";

import { buildHandoff, markdownFileName } from "./handoff";

describe("buildHandoff", () => {
  test("짧은 문서는 프롬프트를 본문 앞에 붙여 URL에 담는다", () => {
    const handoff = buildHandoff({
      service: "chatgpt",
      prompt: "요약해줘",
      markdown: "Short note about plain text.",
    });

    expect(handoff.mode).toBe("url");
    const url = new URL(handoff.href);
    expect(url.origin + url.pathname).toBe("https://chatgpt.com/");
    expect(url.searchParams.get("q")).toBe(
      "요약해줘\n\nShort note about plain text."
    );
  });

  test("Claude는 새 대화 주소로 연다", () => {
    const handoff = buildHandoff({
      service: "claude",
      prompt: "",
      markdown: "Short note.",
    });

    expect(handoff.mode).toBe("url");
    const url = new URL(handoff.href);
    expect(url.origin + url.pathname).toBe("https://claude.ai/new");
    expect(url.searchParams.get("q")).toBe("Short note.");
  });

  test("프롬프트가 없으면 본문만 넘긴다", () => {
    const handoff = buildHandoff({
      service: "claude",
      prompt: "",
      markdown: "Only the body.",
    });

    expect(new URL(handoff.href).searchParams.get("q")).toBe("Only the body.");
  });

  test("인코딩된 주소가 한도를 넘으면 전체 텍스트를 클립보드로 넘기고 빈 새 대화를 연다", () => {
    const markdown = "한글 문서 본문입니다. ".repeat(120);
    const handoff = buildHandoff({
      service: "claude",
      prompt: "한국어로 번역해줘",
      markdown,
    });

    expect(handoff.mode).toBe("clipboard");
    if (handoff.mode !== "clipboard") return;
    expect(handoff.text).toBe(`한국어로 번역해줘\n\n${markdown}`);
    expect(handoff.href).toBe("https://claude.ai/new");
  });

  test("글자 수가 같아도 한글은 인코딩 길이 때문에 먼저 한도를 넘는다", () => {
    const english = buildHandoff({
      service: "chatgpt",
      prompt: "",
      markdown: "a".repeat(1500),
    });
    const korean = buildHandoff({
      service: "chatgpt",
      prompt: "",
      markdown: "가".repeat(1500),
    });

    expect(english.mode).toBe("url");
    expect(korean.mode).toBe("clipboard");
  });
});

describe("markdownFileName", () => {
  test("제목에서 읽을 수 있는 .md 파일명을 만든다", () => {
    expect(markdownFileName("Why plain text outlasts every app")).toBe(
      "why-plain-text-outlasts-every-app.md"
    );
  });

  test("한글 제목과 특수문자를 처리한다", () => {
    expect(markdownFileName("마크다운 - 위키백과, 우리 모두의 백과사전")).toBe(
      "마크다운-위키백과-우리-모두의-백과사전.md"
    );
  });

  test("제목이 비면 기본 이름을 쓴다", () => {
    expect(markdownFileName("  ")).toBe("page.md");
    expect(markdownFileName("???")).toBe("page.md");
  });
});
