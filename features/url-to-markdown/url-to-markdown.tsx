"use client";

import { useRef, useState } from "react";
import { CircleAlertIcon, LinkIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import { convertUrl } from "./actions";
import type { ConvertFailure } from "./convert-page";
import { ExportPanel } from "./export-panel";
import { isHttpUrl } from "./is-http-url";
import { MarkdownView } from "./markdown-view";
import type { PromptId } from "./prompts";
import { UrlField } from "./url-field";

type Page = { title: string; author: string; markdown: string };

type View =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; page: Page }
  | { status: "failed"; reason: Exclude<ConvertFailure, "invalid-url"> };

const FAILURE_MESSAGE: Record<Exclude<ConvertFailure, "invalid-url">, { title: string; description: string }> = {
  "fetch-failed": {
    title: "페이지를 가져오지 못했습니다",
    description:
      "사이트가 접근을 막았거나(HTTP 403 등), 네트워크 오류, 응답 시간 초과가 있었습니다. 로그인이 필요하거나 봇을 차단하는 페이지일 수 있습니다.",
  },
  "not-html": {
    title: "HTML 페이지가 아닙니다",
    description: "PDF나 이미지 같은 파일은 변환할 수 없습니다. 웹 페이지의 주소를 입력해 주세요.",
  },
  "empty-content": {
    title: "본문을 찾지 못했습니다",
    description:
      "페이지는 열렸지만 추출할 내용이 거의 없습니다. 브라우저에서 스크립트로 내용을 그리는 페이지이거나 차단 안내만 보이는 페이지일 수 있습니다.",
  },
};

function inputErrorFor(value: string) {
  if (!value) return "URL을 입력해 주세요.";
  if (!isHttpUrl(value)) return "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";
  return null;
}

export function UrlToMarkdown() {
  const [url, setUrl] = useState("");
  // 변환이 끝난 뒤 URL을 고쳤는지. 고치면 지우기 X 대신 변환 화살표로 돌아간다.
  const [edited, setEdited] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ status: "idle" });
  const [selectedPrompt, setSelectedPrompt] = useState<PromptId | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function convert() {
    if (view.status === "loading") return;
    const value = url.trim();
    const error = inputErrorFor(value);
    setInputError(error);
    if (error) return;

    setEdited(false);
    setView({ status: "loading" });
    try {
      const result = await convertUrl(value);
      if (result.ok) {
        setView({ status: "done", page: result });
      } else if (result.reason === "invalid-url") {
        setView({ status: "idle" });
        setInputError(inputErrorFor("invalid"));
      } else {
        setView({ status: "failed", reason: result.reason });
      }
    } catch {
      setView({ status: "failed", reason: "fetch-failed" });
    }
  }

  function clear() {
    setUrl("");
    setEdited(false);
    setInputError(null);
    setView({ status: "idle" });
    setSelectedPrompt(null);
    setCustomPrompt("");
    inputRef.current?.focus();
  }

  const loading = view.status === "loading";
  const settled = view.status === "done" || view.status === "failed";

  return (
    <div className="@container flex flex-col gap-6">
      <UrlField
        value={url}
        onValueChange={(value) => {
          setUrl(value);
          setEdited(true);
          setInputError(null);
        }}
        onSubmit={convert}
        onClear={clear}
        loading={loading}
        showClear={settled && !edited}
        error={inputError}
        inputRef={inputRef}
      />

      {view.status === "idle" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LinkIcon />
            </EmptyMedia>
            <EmptyTitle>변환할 페이지의 주소를 입력하세요</EmptyTitle>
            <EmptyDescription>
              광고와 메뉴를 걷어내고 제목, 저자, 본문만 Markdown으로 가져옵니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {loading && (
        <div role="status" aria-busy="true" aria-label="변환 중" className="flex flex-col gap-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="mt-6 h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      )}

      {view.status === "failed" && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{FAILURE_MESSAGE[view.reason].title}</AlertTitle>
          <AlertDescription>{FAILURE_MESSAGE[view.reason].description}</AlertDescription>
        </Alert>
      )}

      {view.status === "done" && (
        <div className="grid grid-cols-1 gap-5 @3xl:grid-cols-[minmax(0,1fr)_19rem]">
          <header className="flex flex-col gap-1 @3xl:col-span-2">
            <h2 className="font-heading text-2xl leading-snug font-semibold tracking-tight wrap-anywhere">
              {view.page.title}
            </h2>
            {view.page.author && (
              <p className="text-sm text-muted-foreground">저자 {view.page.author}</p>
            )}
          </header>
          <div className="@3xl:col-start-2 @3xl:row-start-2">
            <ExportPanel
              title={view.page.title}
              markdown={view.page.markdown}
              selectedPrompt={selectedPrompt}
              onSelectedPromptChange={setSelectedPrompt}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
            />
          </div>
          <Card className="min-w-0 @3xl:col-start-1 @3xl:row-start-2">
            <CardContent>
              <MarkdownView markdown={view.page.markdown} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
