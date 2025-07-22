import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // FCM token alma
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('FCM Token alınamadı:', error);
      return null;
    }
  }

  // Push notification izinleri
  async requestPermissions(): Promise<boolean> {
    try {
      // Expo notifications permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Firebase messaging permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return finalStatus === 'granted' && enabled;
    } catch (error) {
      console.error('İzin alınamadı:', error);
      return false;
    }
  }

  // Background/Quit state mesaj dinleyicisi
  setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background/Quit state mesaj alındı:', remoteMessage);
      
      // Burada local notification göster
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'Yeni Mesaj',
          body: remoteMessage.notification?.body || 'Size bir mesaj geldi',
          data: remoteMessage.data,
        },
        trigger: null, // Hemen göster
      });
    });
  }

  // Foreground mesaj dinleyicisi
  setupForegroundMessageListener(callback: (message: any) => void) {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground mesaj alındı:', remoteMessage);
      callback(remoteMessage);
    });

    return unsubscribe;
  }

  // Token yenileme dinleyicisi
  setupTokenRefreshListener(callback: (token: string) => void) {
    const unsubscribe = messaging().onTokenRefresh((token) => {
      console.log('FCM Token yenilendi:', token);
      callback(token);
    });

    return unsubscribe;
  }

  // Server'a token gönder
  async sendTokenToServer(token: string, userId?: string): Promise<boolean> {
    try {
      // Burada kendi backend API'nize token gönderin
      const response = await fetch('YOUR_BACKEND_URL/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId,
          platform: 'mobile',
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Token server\'a gönderilemedi:', error);
      return false;
    }
  }

  // Delayed notification gönder (server üzerinden)
  async scheduleRemoteNotification(
    delay: number,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const token = await this.getFCMToken();
      if (!token) return false;

      // Backend API'ye delayed notification request gönder
      const response = await fetch('YOUR_BACKEND_URL/schedule-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          delay,
          notification: {
            title,
            body,
            data,
          },
          scheduleTime: new Date(Date.now() + delay * 1000).toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Remote notification zamanlanamadı:', error);
      return false;
    }
  }
}

export default NotificationService;
