import { notificationService } from '../services/NotificationService';

export async function copyToClipboard(text: string, successMessage = 'Copied to clipboard!'): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      notificationService.showToast(successMessage, 'success', 'Success', 2500);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      notificationService.showToast(successMessage, 'success', 'Success', 2500);
    }
    return successful;
  } catch (err) {
    console.error('[Clipboard] Failed to copy:', err);
    notificationService.showToast('Could not copy to clipboard. Please copy manually.', 'error');
    return false;
  }
}
