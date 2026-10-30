/**
 * Utility to extract YouTube video ID from various link formats
 * Supports standard URLs, short youtu.be, shorts, embeds, and raw 11-char IDs
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Full URLs including youtu.be, /watch?v=, /embed/, /shorts/, and mobile m.youtube.com
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

