/**
 * Formats a raw string into the required Room ID pattern XXXX (e.g. ABX9)
 */
export function formatRoomIdInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
}

export function validateRoomId(id: string): boolean {
  return /^[A-Z0-9]{4}$/.test(id);
}

/**
 * Formats elapsed seconds into mm:ss or hh:mm:ss for studio clock display
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats ISO timestamp to short human time (e.g. "2:15 PM") for Chat
 */
export function formatChatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}
