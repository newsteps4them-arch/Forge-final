export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

type Listener = (notification: AppNotification) => void;

class NotificationManager {
  private listeners: Listener[] = [];
  
  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string, type: NotificationType = 'info', duration: number = 4000) {
    const notification: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration
    };
    this.listeners.forEach(l => l(notification));
  }
}

export const toast = new NotificationManager();
