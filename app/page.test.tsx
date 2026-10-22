import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("@/features/url-to-markdown/actions", () => ({ convertUrl: vi.fn() }));

import Home from "@/app/page";

test("홈 화면은 제목과 URL 입력란, 처음 안내를 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "웹 페이지를 Markdown으로" })
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "웹 페이지 URL" })).toBeInTheDocument();
  expect(screen.getByText("변환할 페이지의 주소를 입력하세요")).toBeInTheDocument();
});
