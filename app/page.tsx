import { UrlToMarkdown } from "@/features/url-to-markdown";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
          웹 페이지를 Markdown으로
        </h1>
        <p className="text-muted-foreground">
          URL을 붙여 넣으면 본문만 뽑아 LLM에 바로 넘길 수 있습니다.
        </p>
      </div>
      <UrlToMarkdown />
    </div>
  );
}
