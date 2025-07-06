self.addEventListener('push', function(event) {
  const data = event.data.json();
  console.log('🔔 Push Received:', data);

  const title = data.title || 'New Notification';
  const options = {
    body: data.body,
    icon: '/zenList-192.png',
    badge: '/zenList-192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
