import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ className, ...props }) => (
    <h3 className={cn("mt-8 mb-2 text-xl font-semibold first:mt-0", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h3 className={cn("mt-8 mb-2 text-lg font-semibold first:mt-0", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h4 className={cn("mt-6 mb-2 text-base font-semibold first:mt-0", className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h5 className={cn("mt-6 mb-2 text-sm font-semibold first:mt-0", className)} {...props} />
  ),
  p: ({ className, ...props }) => <p className={cn("mb-4 last:mb-0", className)} {...props} />,
  ul: ({ className, ...props }) => (
    <ul className={cn("mb-4 list-disc pl-6 *:mt-1", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("mb-4 list-decimal pl-6 *:mt-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mb-4 border-l-2 pl-4 text-muted-foreground", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn("mb-4 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-sm", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] [pre_&]:bg-transparent [pre_&]:p-0", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("underline underline-offset-4", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    // 외부 페이지의 임의 이미지라 크기를 알 수 없어 next/image를 쓰지 않는다.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn("my-4 h-auto max-w-full rounded-lg", className)} alt={alt ?? ""} {...props} />
  ),
  hr: () => <hr className="my-6" />,
  table: ({ className, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border px-3 py-1.5 text-left font-medium", className)} {...props} />
  ),
  td: ({ className, ...props }) => <td className={cn("border px-3 py-1.5", className)} {...props} />,
};

export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="text-sm leading-7 wrap-anywhere">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
