// components/NotificationBell.jsx
import API from '../api/config';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        setError(null); // Clear previous errors
        const response = await API.get(`/notifications/${userId}`);
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setError('Failed to load notifications.'); // Set error state
      } finally {
        setLoading(false); // Set loading to false after fetching (success or failure)
      }
    };

    if (userId) {
      fetchNotifications();
    } else {
      setNotifications([]); // Clear notifications if userId is not available
      setLoading(false); // Stop loading if no userId
    }

    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true
    });

    socket.on('newNotification', (notification) => {
      if (notification.userId === userId) {
        setNotifications((prev) => [notification, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Mark notification as read
  const handleRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative text-gray-300">
      <button onClick={() => setOpen(!open)} className="relative text-xl">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bg-gray-800 shadow-lg p-4 w-72 top-8 right-0 z-10 border rounded-md max-h-60 overflow-y-auto">
          <h4 className="font-bold mb-2">Notifications</h4>
          {loading ? (
            <p className="text-gray-500">Loading notifications...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500">No notifications yet.</p>
          ) : (
            notifications.map((note) => (
              <div
                key={note._id}
                className={`mb-2 p-2 rounded ${
                  note.read ? 'bg-gray-400' : 'bg-gray-100'
                }`}
              >
                <p className="text-sm text-gray-700">{note.message}</p>
                {!note.read && (
                  <button
                    onClick={() => handleRead(note._id)}
                    className="text-xs text-blue-600 underline mt-1"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
