export const PROMPT_PRESETS = [
  { id: "summarize", label: "요약해줘", text: "요약해줘" },
  { id: "translate", label: "한국어로 번역해줘", text: "한국어로 번역해줘" },
  { id: "explain", label: "쉽게 설명해줘", text: "쉽게 설명해줘" },
] as const;

export type PromptId = (typeof PROMPT_PRESETS)[number]["id"] | "custom";

// 선택한 프롬프트를 본문 앞에 붙일 문장으로 바꾼다. 선택하지 않았거나 직접 입력이 비어 있으면 빈 문자열이다.
export function resolvePrompt(selected: PromptId | null, custom: string) {
  if (selected === "custom") return custom.trim();
  return PROMPT_PRESETS.find((preset) => preset.id === selected)?.text ?? "";
}
