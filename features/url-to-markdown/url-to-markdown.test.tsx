import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { ConvertResult } from "./convert-page";

const convertUrl = vi.fn<(url: string) => Promise<ConvertResult>>();
vi.mock("./actions", () => ({ convertUrl: (url: string) => convertUrl(url) }));

import { UrlToMarkdown } from "./url-to-markdown";

const SHORT_DOC: ConvertResult = {
  ok: true,
  title: "Why plain text outlasts every app",
  author: "Maya Lindqvist",
  markdown: "Every few years a note-taking app promises to hold your thinking.\n\n## The three-decade test\n\nOpen a text file written in 1994.",
};
const LONG_DOC: ConvertResult = {
  ok: true,
  title: "마크다운 - 위키백과",
  author: "",
  markdown: "마크다운은 일반 텍스트 기반의 경량 마크업 언어다. ".repeat(80),
};

const writeText = vi.fn<(text: string) => Promise<void>>();
const openWindow = vi.fn();

beforeEach(() => {
  convertUrl.mockReset();
  writeText.mockReset().mockResolvedValue(undefined);
  openWindow.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  vi.spyOn(window, "open").mockImplementation(openWindow);
});
afterEach(() => vi.restoreAllMocks());

const urlInput = () => screen.getByRole("textbox", { name: "웹 페이지 URL" });

async function convert(url: string, doc: ConvertResult) {
  convertUrl.mockResolvedValueOnce(doc);
  fireEvent.change(urlInput(), { target: { value: url } });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));
  await screen.findByRole("heading", { level: 2 });
}

test("처음에는 변환 화살표와 입력 안내만 보인다", () => {
  render(<UrlToMarkdown />);

  expect(screen.getByRole("button", { name: "변환" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "지우기" })).not.toBeInTheDocument();
  expect(screen.getByText("변환할 페이지의 주소를 입력하세요")).toBeInTheDocument();
});

test("변환하면 제목과 저자와 렌더링된 Markdown이 나오고 화살표가 X로 바뀐다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);

  expect(convertUrl).toHaveBeenCalledWith("https://blog.example.com/plain-text");
  expect(
    screen.getByRole("heading", { level: 2, name: "Why plain text outlasts every app" })
  ).toBeInTheDocument();
  expect(screen.getByText("저자 Maya Lindqvist")).toBeInTheDocument();
  // 본문의 ##는 문서 제목(h2) 아래이므로 h3으로 내려 렌더링한다.
  expect(screen.getByRole("heading", { level: 3, name: "The three-decade test" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "지우기" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "변환" })).not.toBeInTheDocument();
});

test("결과가 나온 뒤 URL을 고치면 X가 화살표로 돌아온다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);

  fireEvent.change(urlInput(), { target: { value: "https://blog.example.com/other" } });

  expect(screen.getByRole("button", { name: "변환" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "지우기" })).not.toBeInTheDocument();
});

test("저자가 없으면 저자 줄을 보여주지 않는다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://ko.wikipedia.org/wiki/x", LONG_DOC);

  expect(screen.queryByText(/^저자/)).not.toBeInTheDocument();
});

test("http(s) 주소가 아니면 변환하지 않고 입력 오류를 보여준다", () => {
  render(<UrlToMarkdown />);

  fireEvent.change(urlInput(), { target: { value: "blog.example.com/post" } });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));

  expect(convertUrl).not.toHaveBeenCalled();
  expect(screen.getByText("http:// 또는 https://로 시작하는 주소를 입력해 주세요.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "변환" })).toBeInTheDocument();

  fireEvent.change(urlInput(), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));
  expect(screen.getByText("URL을 입력해 주세요.")).toBeInTheDocument();
});

test("변환 중에는 입력과 버튼이 잠겨 중복 제출되지 않는다", async () => {
  let finish: (result: ConvertResult) => void = () => {};
  convertUrl.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
  render(<UrlToMarkdown />);

  fireEvent.change(urlInput(), { target: { value: "https://blog.example.com/slow" } });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));

  expect(await screen.findByLabelText("변환 중")).toBeInTheDocument();
  expect(urlInput()).toHaveAttribute("readonly");
  expect(screen.getByRole("button", { name: "변환" })).toBeDisabled();
  fireEvent.submit(urlInput().closest("form")!);
  expect(convertUrl).toHaveBeenCalledTimes(1);

  finish(SHORT_DOC);
  await screen.findByRole("heading", { level: 2, name: SHORT_DOC.ok ? SHORT_DOC.title : "" });
});

test.each([
  ["fetch-failed", "페이지를 가져오지 못했습니다"],
  ["not-html", "HTML 페이지가 아닙니다"],
  ["empty-content", "본문을 찾지 못했습니다"],
] as const)("%s 실패는 구분된 오류를 보여주고 입력을 유지한다", async (reason, title) => {
  convertUrl.mockResolvedValueOnce({ ok: false, reason });
  render(<UrlToMarkdown />);

  fireEvent.change(urlInput(), { target: { value: "https://www.example.com/a" } });
  fireEvent.click(screen.getByRole("button", { name: "변환" }));

  expect(await screen.findByText(title)).toBeInTheDocument();
  expect(urlInput()).toHaveValue("https://www.example.com/a");
  expect(screen.getByRole("button", { name: "지우기" })).toBeInTheDocument();
});

test("지우기는 입력, 결과, 선택한 프롬프트와 직접 입력을 모두 초기화한다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  fireEvent.change(screen.getByRole("textbox", { name: "직접 입력한 프롬프트" }), {
    target: { value: "핵심만 3줄로" },
  });

  fireEvent.click(screen.getByRole("button", { name: "지우기" }));

  expect(urlInput()).toHaveValue("");
  expect(urlInput()).toHaveFocus();
  expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "변환" })).toBeInTheDocument();

  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  expect(screen.getByRole("button", { name: "직접 입력" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("textbox", { name: "직접 입력한 프롬프트" })).not.toBeInTheDocument();
});

test("프롬프트는 하나만 선택되고 다시 누르면 풀린다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  const summarize = screen.getByRole("button", { name: "요약해줘" });
  const translate = screen.getByRole("button", { name: "한국어로 번역해줘" });

  fireEvent.click(summarize);
  expect(summarize).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(translate);
  expect(summarize).toHaveAttribute("aria-pressed", "false");
  expect(translate).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(translate);
  expect(translate).toHaveAttribute("aria-pressed", "false");
});

test("직접 입력을 고를 때만 입력란이 나타난다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);

  expect(screen.queryByRole("textbox", { name: "직접 입력한 프롬프트" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
  expect(screen.getByRole("textbox", { name: "직접 입력한 프롬프트" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));
  expect(screen.queryByRole("textbox", { name: "직접 입력한 프롬프트" })).not.toBeInTheDocument();
});

test("복사하기는 프롬프트 없이 Markdown만 복사한다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: "복사하기" }));

  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  expect(writeText).toHaveBeenCalledWith(SHORT_DOC.ok ? SHORT_DOC.markdown : "");
});

test("짧은 문서를 ChatGPT로 열면 프롬프트가 앞에 붙은 주소로 새 탭을 연다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: /ChatGPT로 열기/ }));

  await waitFor(() => expect(openWindow).toHaveBeenCalledTimes(1));
  const href = new URL(openWindow.mock.calls[0][0] as string);
  expect(href.origin).toBe("https://chatgpt.com");
  expect(href.searchParams.get("q")).toBe(`요약해줘\n\n${SHORT_DOC.ok ? SHORT_DOC.markdown : ""}`);
  expect(writeText).not.toHaveBeenCalled();
});

test("직접 입력한 프롬프트가 비어 있으면 본문만 넘긴다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://blog.example.com/plain-text", SHORT_DOC);
  fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));

  fireEvent.click(screen.getByRole("button", { name: /Claude로 열기/ }));

  await waitFor(() => expect(openWindow).toHaveBeenCalledTimes(1));
  const href = new URL(openWindow.mock.calls[0][0] as string);
  expect(href.origin + href.pathname).toBe("https://claude.ai/new");
  expect(href.searchParams.get("q")).toBe(SHORT_DOC.ok ? SHORT_DOC.markdown : "");
});

test("긴 문서는 전체 텍스트를 복사하고 새 탭을 열며 붙여넣기 안내를 보여준다", async () => {
  render(<UrlToMarkdown />);
  await convert("https://ko.wikipedia.org/wiki/x", LONG_DOC);
  fireEvent.click(screen.getByRole("button", { name: "요약해줘" }));

  fireEvent.click(screen.getByRole("button", { name: /Claude로 열기/ }));

  expect(await screen.findByText("전체 텍스트를 복사하고 Claude 새 탭을 열었습니다")).toBeInTheDocument();
  expect(writeText).toHaveBeenCalledWith(`요약해줘\n\n${LONG_DOC.ok ? LONG_DOC.markdown : ""}`);
  expect(openWindow).toHaveBeenCalledWith("https://claude.ai/new", "_blank", "noopener,noreferrer");
});

test("긴 문서에서 클립보드 복사가 실패하면 새 탭을 열지 않고 경고한다", async () => {
  writeText.mockRejectedValue(new Error("denied"));
  render(<UrlToMarkdown />);
  await convert("https://ko.wikipedia.org/wiki/x", LONG_DOC);

  fireEvent.click(screen.getByRole("button", { name: /ChatGPT로 열기/ }));

  expect(await screen.findByText("클립보드에 복사하지 못했습니다")).toBeInTheDocument();
  expect(openWindow).not.toHaveBeenCalled();
});
