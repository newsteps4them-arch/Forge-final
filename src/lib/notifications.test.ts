import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from './notifications';

describe('NotificationManager', () => {
  // Clear any potential existing listeners between tests by replacing the instance or clearing.
  // Since toast is a singleton, we need to be careful. However, our tests will just use standard sub/unsub.

  it('should notify a subscribed listener when show is called', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.show('Test message');

    expect(listener).toHaveBeenCalledTimes(1);
    const notification = listener.mock.calls[0][0];
    expect(notification).toMatchObject({
      message: 'Test message',
      type: 'info',
      duration: 4000,
    });
    expect(notification.id).toBeDefined();
    expect(typeof notification.id).toBe('string');

    unsubscribe();
  });

  it('should use provided custom parameters', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.show('Error occurred', 'error', 5000);

    expect(listener).toHaveBeenCalledTimes(1);
    const notification = listener.mock.calls[0][0];
    expect(notification).toMatchObject({
      message: 'Error occurred',
      type: 'error',
      duration: 5000,
    });

    unsubscribe();
  });

  it('should stop notifying a listener after it unsubscribes', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    toast.show('Message 1');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    toast.show('Message 2');
    expect(listener).toHaveBeenCalledTimes(1); // Should still be 1
  });

  it('should notify multiple listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsubscribe1 = toast.subscribe(listener1);
    const unsubscribe2 = toast.subscribe(listener2);

    toast.show('Broadcast message');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsubscribe1();
    unsubscribe2();
  });
});
