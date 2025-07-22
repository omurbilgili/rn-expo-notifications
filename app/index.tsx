import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const [isScheduled, setIsScheduled] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });
  }, []);

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
      // Cancel any existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Schedule a new notification for 1 minute later
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Zamanlı Bildirim! 🔔",
          body: "1 dakika önce butona basmıştınız. Uygulama kapalı olsa da bildirim geldi!",
          data: { scheduledAt: new Date().toISOString() },
        },
        trigger: {
          seconds: 60, // 1 minute = 60 seconds
        },
      });

      setIsScheduled(true);
      Alert.alert(
        'Bildirim Zamanlandı', 
        '1 dakika sonra size bildirim gelecek. Uygulamayı kapatabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => console.log('Notification scheduled for 1 minute')
          }
        ]
      );
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
        Push Token: {expoPushToken ? 'Alındı ✅' : 'Yükleniyor...'}
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
});
