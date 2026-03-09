import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'pending_reminders';

function readPending(): Array<{ entryId: string; triggerAt: string }> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function writePending(list: Array<{ entryId: string; triggerAt: string }>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function scheduleFollowUpReminder(entryId: string, delayMinutes: number): Promise<void> {
  const triggerAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

  // Always persist to localStorage so the UI can pick it up regardless of platform
  const pending = readPending();
  pending.push({ entryId, triggerAt });
  writePending(pending);

  if (!Capacitor.isNativePlatform()) {
    // Web fallback: browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification('Glucose Check Reminder', {
          body: 'Time to check your blood glucose and log your follow-up!',
          icon: '/favicon.ico',
        });
      }, delayMinutes * 60 * 1000);
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
    return;
  }

  // Native: schedule via Capacitor
  await LocalNotifications.requestPermissions();
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Glucose Check Reminder',
        body: 'Time to check your blood glucose and log your follow-up!',
        id: Math.floor(Math.random() * 100000),
        schedule: { at: new Date(Date.now() + delayMinutes * 60 * 1000) },
        extra: { entryId },
      },
    ],
  });
}

export function getPendingReminders(): Array<{ entryId: string; triggerAt: string }> {
  const pending = readPending();
  return pending.filter(
    (r) => new Date(r.triggerAt).getTime() <= Date.now()
  );
}

export function clearReminder(entryId: string): void {
  const filtered = readPending().filter((r) => r.entryId !== entryId);
  writePending(filtered);
}

/**
 * Call once at app startup. Fires a storage event so the Dashboard's
 * interval picks up reminders when the user returns from the background
 * or taps a notification.
 */
export function initNotificationListeners(): void {
  const dispatchRefresh = () => window.dispatchEvent(new Event('storage'));

  // Refresh when returning to the app (works on web + native without extra plugins)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') dispatchRefresh();
  });
  window.addEventListener('focus', dispatchRefresh);

  if (!Capacitor.isNativePlatform()) return;

  // When user taps the notification, the app resumes — mark that reminder as immediately due
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const entryId = action.notification?.extra?.entryId as string | undefined;
    if (!entryId) return;

    const pending = readPending();
    const updated = pending.map((r) =>
      r.entryId === entryId
        ? { ...r, triggerAt: new Date(Date.now() - 1000).toISOString() }
        : r
    );
    writePending(updated);
    dispatchRefresh();
  });
}

