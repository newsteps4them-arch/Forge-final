import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('Push received', event);
});

self.addEventListener('sync', (event) => {
  console.log('Sync event', event);
});

// @ts-ignore - periodicsync is not fully typed
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync event', event);
});
