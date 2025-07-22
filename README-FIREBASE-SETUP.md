# Firebase FCM Push Notification Kurulumu

## ⚠️ ÖNEMLİ: Uygulama Kapalı İken Push Notification

Şu anki kodunuz **sadece local notifications** kullanıyor. Bu demek oluyor ki:

❌ **Mevcut Durum:**
- Bildirimler sadece uygulama cihazda yüklü iken çalışır
- Uygulama silinirse bildirimler gelmez
- Gerçek push notification değil, sadece zamanlanmış yerel bildirim

✅ **Firebase FCM ile Çözüm:**
- Uygulama tamamen kapalı olsa bile bildirim gelir
- Uygulama silinse bile server'dan bildirim gönderilebilir
- Gerçek remote push notification

## Kurulum Adımları

### 1. Firebase Console Setup
1. [Firebase Console](https://console.firebase.google.com) git
2. Yeni proje oluştur veya mevcut projeyi kullan
3. Android/iOS uygulaması ekle
4. `google-services.json` (Android) ve `GoogleService-Info.plist` (iOS) dosyalarını indir

### 2. Android Kurulumu
```bash
# google-services.json dosyasını android/app/ klasörüne koy
cp google-services.json android/app/

# android/build.gradle dosyasına ekle:
# classpath 'com.google.gms:google-services:4.3.15'

# android/app/build.gradle dosyasına ekle:
# apply plugin: 'com.google.gms.google-services'
```

### 3. iOS Kurulumu
```bash
# GoogleService-Info.plist dosyasını ios/ klasörüne koy
cp GoogleService-Info.plist ios/

# iOS için additional setup gerekebilir
npx expo run:ios
```

### 4. Bağımlılık Kurulumu
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 5. Backend Server Kurulumu
Backend server'ınızda Firebase Admin SDK kullanmanız gerekiyor:

```bash
npm install firebase-admin express
```

### 6. NotificationService.ts içindeki URL'leri değiştir
```typescript
// YOUR_BACKEND_URL yerine gerçek backend URL'inizi yazın
const response = await fetch('https://your-backend.com/register-token', {
  // ...
});
```

## Test Etme

1. Uygulamayı build edin: `npx expo run:android` veya `npx expo run:ios`
2. FCM token'ın alındığından emin olun
3. Backend server'ınızı çalıştırın
4. Butona basın ve uygulamayı kapatın
5. 1 dakika sonra bildirim gelmelidir

## Production için
- Firebase Admin SDK service account key dosyasını güvenli yerde saklayın
- Token'ları veritabanında saklayın
- Queue system kullanarak zamanlanmış bildirimleri yönetin (Redis, Bull.js vs.)

## Debugging
- FCM token alınamıyorsa Firebase konfigürasyonunu kontrol edin
- Android için google-services.json dosyasının doğru yerde olduğundan emin olun
- iOS için GoogleService-Info.plist dosyasının XCode'da eklendiğinden emin olun
