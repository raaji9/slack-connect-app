import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [userId, setUserId] = useState(null);
  const [channel, setChannel] = useState('');
  const [text, setText] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [response, setResponse] = useState(null);
  const [channels, setChannels] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('userId');
    if (userIdParam) {
      setUserId(userIdParam);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchScheduledMessages = async (currentUserId) => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://localhost:3001/scheduled-messages?userId=${currentUserId}`);
      const data = await res.json();
      if (data.success) {
        setScheduledMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchChannels = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/channels?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setChannels(data.channels);
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };

    fetchChannels();
    fetchScheduledMessages(userId);
  }, [userId]);

  const handleConnect = () => {
    window.location.href = 'https://newly-relevant-marlin.ngrok-free.app/auth/slack';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse(null);

    const endpoint = sendAt ? '/schedule-message' : '/send-message';
    const body = sendAt
      ? { channel, text, sendAt: new Date(sendAt).getTime(), userId }
      : { channel, text, userId };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResponse(data);
      if (data.success && sendAt) {
        fetchScheduledMessages(userId);
      }
    } catch (error) {
      setResponse({ success: false, error: 'Failed to connect to the backend' });
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/cancel-message/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchScheduledMessages(userId);
      }
    } catch (error) {
      console.error('Failed to cancel message:', error);
    }
  };

  if (!userId) {
    return (
      <div className="App">
        <h1>Slack Connect</h1>
        <button onClick={handleConnect}>Connect to Slack</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Slack Message Sender</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="channel">Channel:</label>
          <input
            type="text"
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g., #general"
            list="channels-list"
            required
          />
          <datalist id="channels-list">
            {channels.map((ch) => (
              <option key={ch.id} value={`#${ch.name}`} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="text">Message:</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="sendAt">Schedule for later (optional):</label>
          <input
            type="datetime-local"
            id="sendAt"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
          />
        </div>
        <button type="submit">{sendAt ? 'Schedule Message' : 'Send Message'}</button>
      </form>
      {response && (
        <div className={`response ${response.success ? 'success' : 'error'}`}>
          <h3>{response.success ? 'Success!' : 'Error'}</h3>
          <p>{response.success ? (sendAt ? 'Message scheduled!' : `Message sent to ${response.result.channel}`) : response.error}</p>
        </div>
      )}

      <div className="scheduled-messages">
        <h2>Scheduled Messages</h2>
        {scheduledMessages.length === 0 ? (
          <p>No messages scheduled.</p>
        ) : (
          <ul>
            {scheduledMessages.map((msg) => (
              <li key={msg.id}>
                <span>To: {msg.channel}</span>
                <span>At: {new Date(msg.sendAt).toLocaleString()}</span>
                <p>{msg.text}</p>
                <button onClick={() => handleCancel(msg.id)}>Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
