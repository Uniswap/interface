// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: 'AIzaSyA1K_JAB8h0NIvjtFLHvZhfkFjW4Bls0bw',
  authDomain: 'notification---production.firebaseapp.com',
  projectId: 'notification---production',
  storageBucket: 'notification---production.appspot.com',
  messagingSenderId: '541963997326',
  appId: '1:541963997326:web:a958e2bb7cbeea932679df',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  return
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
      })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === '/discover?tab=trending_soon' && 'focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow('/discover?tab=trending_soon')
      }),
  )
})
