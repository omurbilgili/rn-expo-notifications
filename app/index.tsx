import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NotificationService from './services/NotificationService';

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [fcmToken, setFcmToken] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    // İzinleri al
    const permissionsGranted = await notificationService.requestPermissions();
    
    if (permissionsGranted) {
      // Expo push token al (local notifications için)
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) {
        setExpoPushToken(expoToken);
      }

      // FCM token al (remote push notifications için)
      const fcmToken = await notificationService.getFCMToken();
      if (fcmToken) {
        setFcmToken(fcmToken);
        // Token'ı server'a gönder
        await notificationService.sendTokenToServer(fcmToken);
      }

      // Background mesaj handler setup
      notificationService.setupBackgroundMessageHandler();

      // Foreground mesaj listener
      const unsubscribeForeground = notificationService.setupForegroundMessageListener((message) => {
        Alert.alert(
          message.notification?.title || 'Yeni Mesaj',
          message.notification?.body || 'Size bir mesaj geldi'
        );
      });

      // Token refresh listener
      const unsubscribeTokenRefresh = notificationService.setupTokenRefreshListener(async (newToken) => {
        setFcmToken(newToken);
        await notificationService.sendTokenToServer(newToken);
      });

      return () => {
        unsubscribeForeground();
        unsubscribeTokenRefresh();
      };
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Hata', 'Push notification izni verilmedi!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);

    return token;
  }

  const scheduleNotification = async () => {
    try {
      // Remote push notification ile zamanlama (gerçek push notification)
      const success = await notificationService.scheduleRemoteNotification(
        60, // 1 dakika
        "Gerçek Push Notification! 🔔",
        "1 dakika önce butona basmıştınız. Uygulama tamamen kapalı olsa da bu bildirim geldi!",
        { scheduledAt: new Date().toISOString(), type: 'remote_scheduled' }
      );

      if (success) {
        setIsScheduled(true);
        Alert.alert(
          'Remote Push Notification Zamanlandı', 
          '1 dakika sonra size gerçek push notification gelecek. Uygulamayı kapatabilir, hatta telefonu yeniden başlatabilirsiniz!',
          [
            {
              text: 'Tamam',
              onPress: () => console.log('Remote notification scheduled for 1 minute')
            }
          ]
        );
      } else {
        // Fallback: Local notification
        await Notifications.cancelAllScheduledNotificationsAsync();
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Local Bildirim (Fallback) 📱",
            body: "Remote push başarısız oldu. Bu local bildirim, sadece uygulama yüklü ise çalışır.",
            data: { scheduledAt: new Date().toISOString(), type: 'local_fallback' },
          },
          trigger: {
            seconds: 60,
          },
        });

        setIsScheduled(true);
        Alert.alert(
          'Local Bildirim Zamanlandı (Fallback)', 
          'Remote push notification kurulamadı. Local bildirim zamanlandı.',
        );
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Hata', 'Bildirim zamanlanırken bir hata oluştu.');
    }
  };

  const cancelNotification = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setIsScheduled(false);
      Alert.alert('İptal Edildi', 'Zamanlanmış bildirim iptal edildi.');
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      <Text style={styles.description}>
        Butona bastıktan 1 dakika sonra bildirim alacaksınız.
        Uygulamayı kapattıktan sonra da bildirim gelecektir.
      </Text>

      <TouchableOpacity 
        style={[styles.button, isScheduled && styles.buttonScheduled]}
        onPress={isScheduled ? cancelNotification : scheduleNotification}
      >
        <Text style={styles.buttonText}>
          {isScheduled ? 'Bildirimi İptal Et' : '1 Dakika Sonra Bildirim Gönder'}
        </Text>
      </TouchableOpacity>

      {isScheduled && (
        <Text style={styles.statusText}>
          ✅ Bildirim zamanlandı! 1 dakika sonra gelecek.
        </Text>
      )}

      <Text style={styles.tokenText}>
        Expo Token: {expoPushToken ? 'Alındı ✅' : 'Yükleniyor...'}
      </Text>
      
      <Text style={styles.tokenText}>
        FCM Token: {fcmToken ? 'Alındı ✅' : 'Yükleniyor...'}
      </Text>
      
      <Text style={styles.infoText}>
        💡 FCM Token ile gerçek push notification alabilirsiniz.
        Uygulama tamamen kapalı olsa bile bildirim gelir!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonScheduled: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#34C759',
    marginBottom: 20,
    fontWeight: '600',
  },
  tokenText: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
