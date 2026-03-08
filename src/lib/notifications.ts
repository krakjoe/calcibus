import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function scheduleFollowUpReminder(entryId: string, delayMinutes: number): Promise<void> {
  console.log(`Scheduling reminder for ${entryId} with delay ${delayMinutes} minutes`);
  
  if (!Capacitor.isNativePlatform()) {
    // Web fallback: use setTimeout + browser notification
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
    // Also store in localStorage for the app to show
    const pending = JSON.parse(localStorage.getItem('pending_reminders') || '[]');
    const triggerAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
    console.log(`Storing reminder with triggerAt: ${triggerAt}`);
    pending.push({
      entryId,
      triggerAt: triggerAt,
    });
    localStorage.setItem('pending_reminders', JSON.stringify(pending));
    console.log(`Total pending reminders: ${pending.length}`);
    return;
  }

  await LocalNotifications.requestPermissions();
  
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Glucose Check Reminder',
        body: 'Time to check your blood glucose and log your follow-up!',
        id: Math.floor(Math.random() * 100000),
        schedule: {
          at: new Date(Date.now() + delayMinutes * 60 * 1000),
        },
        extra: { entryId },
      },
    ],
  });
}

export function getPendingReminders(): Array<{ entryId: string; triggerAt: string }> {
  const pending = JSON.parse(localStorage.getItem('pending_reminders') || '[]');
  const dueReminders = pending.filter((r: { triggerAt: string }) => new Date(r.triggerAt).getTime() <= Date.now());
  console.log('getPendingReminders: total pending:', pending.length, 'due:', dueReminders.length);
  console.log('All pending reminders:', pending);
  console.log('Due reminders:', dueReminders);
  return dueReminders;
}

export function clearReminder(entryId: string): void {
  const pending = JSON.parse(localStorage.getItem('pending_reminders') || '[]');
  const filtered = pending.filter((r: { entryId: string }) => r.entryId !== entryId);
  localStorage.setItem('pending_reminders', JSON.stringify(filtered));
}
