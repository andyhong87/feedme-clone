# url-to-markdown 코드 리뷰 지적 (재현 전)

`code-review low` 1회에서 나온 지적이며 재현하지 않았고 수용 기준도 깨지 않아 고치지 않았습니다.

- `features/url-to-markdown/convert-page.ts:48` defuddle이 예외를 던지면 클라이언트에서 "페이지를 가져오지 못했습니다"로 표시됩니다. 변환 실패용 사유를 따로 둘지 판단이 필요합니다.
- `features/url-to-markdown/export-panel.tsx:61` `link.click()` 직후 `URL.revokeObjectURL`을 동기 호출해 Safari/Firefox에서 .md 다운로드가 실패할 수 있습니다. 해당 브라우저에서 재현해 확인합니다.
- `features/url-to-markdown/export-panel.tsx:84` 클립보드 `await` 뒤의 `window.open`이 팝업 차단될 수 있는데 화면에는 "새 탭을 열었습니다"가 표시됩니다. Safari 등에서 재현해 확인합니다.
