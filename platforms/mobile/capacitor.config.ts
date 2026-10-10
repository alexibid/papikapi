import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ibid.papikapi',
  appName: 'Papikapi',
  webDir: '../../../../dist/papikapi/browser',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  }
};

export default config;
