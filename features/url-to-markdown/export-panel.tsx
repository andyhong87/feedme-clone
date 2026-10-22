"use client";

import { useState } from "react";
import {
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { buildHandoff, markdownFileName, type LlmService } from "./handoff";
import { PromptPicker } from "./prompt-picker";
import { resolvePrompt, type PromptId } from "./prompts";

const SERVICE_NAME: Record<LlmService, string> = { chatgpt: "ChatGPT", claude: "Claude" };

type Notice = { kind: "paste"; service: LlmService } | { kind: "copy-failed" } | null;

type ExportPanelProps = {
  title: string;
  markdown: string;
  selectedPrompt: PromptId | null;
  onSelectedPromptChange: (selected: PromptId | null) => void;
  customPrompt: string;
  onCustomPromptChange: (custom: string) => void;
};

export function ExportPanel({
  title,
  markdown,
  selectedPrompt,
  onSelectedPromptChange,
  customPrompt,
  onCustomPromptChange,
}: ExportPanelProps) {
  const [notice, setNotice] = useState<Notice>(null);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown을 복사했습니다");
    } catch {
      toast.error("복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }

  function downloadMarkdown() {
    const fileName = markdownFileName(title);
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${fileName} 다운로드를 시작했습니다`);
  }

  async function openIn(service: LlmService) {
    setNotice(null);
    const handoff = buildHandoff({
      service,
      prompt: resolvePrompt(selectedPrompt, customPrompt),
      markdown,
    });

    if (handoff.mode === "clipboard") {
      try {
        await navigator.clipboard.writeText(handoff.text);
      } catch {
        setNotice({ kind: "copy-failed" });
        return;
      }
      setNotice({ kind: "paste", service });
    } else {
      toast.success(`${SERVICE_NAME[service]} 새 탭을 열었습니다`);
    }
    window.open(handoff.href, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="@3xl:sticky @3xl:top-4">
      <CardHeader>
        <CardTitle>내보내기</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 @sm:grid-cols-2">
          <Button variant="outline" onClick={copyMarkdown}>
            <CopyIcon data-icon="inline-start" />
            복사하기
          </Button>
          <Button variant="outline" onClick={downloadMarkdown}>
            <DownloadIcon data-icon="inline-start" />
            .md 받기
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">LLM으로 보내기</h3>
            <p className="text-xs text-muted-foreground">프롬프트 (선택)</p>
          </div>
          <PromptPicker
            selected={selectedPrompt}
            onSelectedChange={onSelectedPromptChange}
            custom={customPrompt}
            onCustomChange={onCustomPromptChange}
          />
          <div className="grid grid-cols-1 gap-2 @sm:grid-cols-2">
            <Button onClick={() => openIn("chatgpt")}>
              ChatGPT로 열기
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
            <Button variant="secondary" onClick={() => openIn("claude")}>
              Claude로 열기
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            문서가 길면 전체 텍스트를 클립보드에 복사한 뒤 새 탭을 엽니다.
          </p>

          {notice?.kind === "paste" && (
            <Alert role="status">
              <InfoIcon />
              <AlertTitle>
                전체 텍스트를 복사하고 {SERVICE_NAME[notice.service]} 새 탭을 열었습니다
              </AlertTitle>
              <AlertDescription>
                입력창을 클릭하고 Ctrl+V(Mac은 ⌘V)로 붙여넣으세요.
              </AlertDescription>
            </Alert>
          )}
          {notice?.kind === "copy-failed" && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>클립보드에 복사하지 못했습니다</AlertTitle>
              <AlertDescription>
                새 탭은 열지 않았습니다. 위의 복사하기로 직접 복사한 뒤 붙여넣어 주세요.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
