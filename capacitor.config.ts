import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forge.app',
  appName: 'Forge OS',
  webDir: 'dist',
  server: {
    url: process.env.APP_URL || "http://10.0.2.2:3000",
    cleartext: true
  }
};

export default config;
