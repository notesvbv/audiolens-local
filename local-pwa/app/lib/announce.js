/**
 * audiolens — screen reader announcements
 *
 * sends messages to the aria-live region so screen readers
 * announce pipeline status changes to visually impaired users.
 */

export function announce(message) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('sr-announcer');
  if (el) {
    el.textContent = '';
    // small delay so screen readers pick up the change
    setTimeout(() => {
      el.textContent = message;
    }, 50);
  }
}
