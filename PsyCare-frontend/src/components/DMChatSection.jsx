import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";

export default function DMChatSection() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null;
  const appUrl = import.meta.env.VITE_APP_URL;

  // Mark self online on mount
  useEffect(() => {
    if (token) {
      fetch(`${appUrl}/api/chat/online`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    return () => {
      if (token) {
        fetch(`${appUrl}/api/chat/offline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    };
  }, [token]);

  // Fetch online users
  useEffect(() => {
    if (!token) return;
    const fetchOnline = async () => {
      const res = await fetch(`${appUrl}/api/chat/online`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOnlineUsers(data.filter(u => u._id !== myId));
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 5000);
    return () => clearInterval(interval);
  }, [token, myId]);

  // Fetch messages with selected user
  useEffect(() => {
    if (!selectedUser || !token) return;
    const fetchMessages = async () => {
      const res = await fetch(`${appUrl}/api/chat/dm/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser, token]);

  // Send DM
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const res = await fetch(`${appUrl}/api/chat/dm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: selectedUser._id, message: newMessage }),
    });
    if (res.ok) {
      setNewMessage("");
      toast.success("Message sent!");
    } else {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      <h2 className="text-3xl font-bold mb-6">Direct Messages (1:1 Chat)</h2>
      <div className="w-full max-w-3xl flex gap-8">
        {/* Online Users List */}
        <div className="w-1/3 bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-lg mb-4">Online Users ({onlineUsers.length})</h3>
          <ul className="space-y-3">
            {onlineUsers.map((u) => (
              <li key={u._id}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${selectedUser?._id === u._id ? "bg-purple-200 text-purple-700" : "bg-gray-100 text-gray-700 hover:bg-purple-100"}`}
                  onClick={() => setSelectedUser(u)}
                >
                  {u.name || u.email}
                </button>
              </li>
            ))}
            {onlineUsers.length === 0 && <li className="text-gray-400">No other users online</li>}
          </ul>
        </div>
        {/* DM Chat Window */}
        <div className="w-2/3 bg-white rounded-xl shadow-lg p-4 flex flex-col">
          {selectedUser ? (
            <>
              <div className="font-semibold text-lg mb-2">Chat with {selectedUser.name || selectedUser.email}</div>
              <div className="flex-1 overflow-y-auto mb-4 border rounded p-2 bg-gray-50" style={{ maxHeight: 400 }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-2 flex ${msg.from === myId ? "justify-end" : "justify-start"}`}>
                    <div className={`inline-block px-4 py-2 rounded-lg ${msg.from === myId ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                      {msg.message}
                      <div className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-gray-400 text-center">No messages yet</div>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                />
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition"
                  onClick={handleSend}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 flex-1 flex items-center justify-center">Select an online user to start chatting</div>
          )}
        </div>
      </div>
    </div>
  );
}
