"use client";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { PROMPT_PRESETS, type PromptId } from "./prompts";

type PromptPickerProps = {
  selected: PromptId | null;
  onSelectedChange: (selected: PromptId | null) => void;
  custom: string;
  onCustomChange: (custom: string) => void;
};

export function PromptPicker({
  selected,
  onSelectedChange,
  custom,
  onCustomChange,
}: PromptPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
        aria-label="프롬프트"
        value={selected ? [selected] : []}
        onValueChange={(value) => onSelectedChange((value[0] as PromptId | undefined) ?? null)}
      >
        {PROMPT_PRESETS.map((preset) => (
          <ToggleGroupItem key={preset.id} value={preset.id}>
            {preset.label}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem value="custom">직접 입력</ToggleGroupItem>
      </ToggleGroup>
      {selected === "custom" && (
        <Input
          aria-label="직접 입력한 프롬프트"
          placeholder="LLM에게 시킬 내용을 입력하세요"
          autoComplete="off"
          value={custom}
          onChange={(event) => onCustomChange(event.target.value)}
        />
      )}
    </div>
  );
}
