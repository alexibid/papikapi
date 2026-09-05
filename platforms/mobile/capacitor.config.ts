import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.camila.app',
  appName: 'Camila',
  webDir: '../../../../dist/camila/browser',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  }
};

export default config;
