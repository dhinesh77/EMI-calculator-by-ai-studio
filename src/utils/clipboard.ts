/**
 * Safely copies text to the clipboard with automatic fallback for iframes,
 * unfocused documents, or environments without clipboard API permissions.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // First attempt to focus the window if allowed
  try {
    if (typeof window !== 'undefined' && typeof window.focus === 'function') {
      window.focus();
    }
  } catch {
    // Ignore window focus errors
  }

  // 1. Try modern navigator.clipboard API if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Continue to fallback if clipboard API fails (e.g. document not focused or permission denied)
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
    }
  }

  // 2. Fallback: temporary textarea + document.execCommand('copy')
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Prevent scrolling or visual glitches
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.warn('document.execCommand copy fallback failed:', err);
  }

  return false;
}
