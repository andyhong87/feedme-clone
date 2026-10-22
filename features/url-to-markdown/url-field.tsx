"use client";

import type { Ref } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";

import { Field, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type UrlFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading: boolean;
  // 변환이 끝난 뒤 URL을 고치기 전까지는 화살표 자리에 지우기 X를 보여준다.
  showClear: boolean;
  error: string | null;
  inputRef: Ref<HTMLInputElement>;
};

export function UrlField({
  value,
  onValueChange,
  onSubmit,
  onClear,
  loading,
  showClear,
  error,
  inputRef,
}: UrlFieldProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Field data-invalid={error ? true : undefined}>
        <InputGroup className="h-11">
          <InputGroupInput
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            aria-label="웹 페이지 URL"
            aria-invalid={error ? true : undefined}
            placeholder="https://example.com/article"
            value={value}
            readOnly={loading}
            onChange={(event) => onValueChange(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {showClear ? (
              <InputGroupButton
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label="지우기"
                onClick={onClear}
              >
                <XIcon />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="변환"
                disabled={loading}
              >
                {loading ? <Spinner /> : <ArrowRightIcon />}
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    </form>
  );
}
