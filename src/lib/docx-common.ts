/** Delimiter không va chạm với văn bản tiếng Việt trong mẫu nhà nước. */
export const DELIMITERS = { start: '{{', end: '}}' } as const;

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** `{{ key }}` trong văn bản đã ghép (tag có thể bị Word tách qua nhiều run). */
export const TAG_IN_TEXT_REGEX = /\{\{\s*([^{}]*?)\s*\}\}/g;
