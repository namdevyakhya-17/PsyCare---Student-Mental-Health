import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaHeart, FaComment, FaShareAlt } from "react-icons/fa";
import { FiShield } from "react-icons/fi";
import axios from "axios";
import { toast } from "@/components/ui/sonner";

export default function CommunityForum() {
  const [posts, setPosts] = useState([]);
  // Pagination state
  const POSTS_PER_PAGE = 4;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [privateMessage, setPrivateMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const appUrl = import.meta.env.VITE_APP_URL;


  // -----------------------
  // Fetch posts
  // -----------------------
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${appUrl}/api/forum`, {
        // headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setPosts(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load posts.");
        setLoading(false);
      });
  }, [token]);

  // -----------------------
  // Create new post
  // -----------------------
  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    try {
      const res = await axios.post(
        `${appUrl}/api/forum`,
        { title: newTitle || "General", content: newContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data, ...posts]);
      setNewTitle("");
      setNewContent("");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("Sorry, you cannot post threatening messages.", {
          description: "Your post was blocked for safety reasons. Please avoid harmful or threatening language.",
          duration: 5000,
          style: { background: "#f8e1e1", color: "#a94442", border: "1px solid #e57373", fontWeight: "bold" }
        });
      } else if (err.response?.status === 400) {
        toast.error(err.response.data.message, {
          duration: 4000,
        });
      }
    }
  };

  // -----------------------
  // Like a post
  // -----------------------
  const handleLike = async (id) => {
    try {
      const res = await axios.post(
        `${appUrl}/api/forum/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, likes: res.data.likes } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------
  // Public reply
  // -----------------------
  const handleAddComment = async (id) => {
    if (!commentInputs[id]?.trim()) return;
    try {
      const res = await axios.post(
        `${appUrl}/api/forum/${id}/reply`,
        { message: commentInputs[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
      setCommentInputs((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) alert(err.response.data.message);
    }
  };

  // -----------------------
  // Private message
  // -----------------------
  const handlePrivateMessage = async () => {
    if (!privateMessage.trim() || !selectedUser) return;
    try {
      await axios.post(
        `${appUrl}/api/forum/message`,
        { message: privateMessage, to: selectedUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Message sent privately!");
      setPrivateMessage("");
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) alert(err.response.data.message);
    }
  };

  // -----------------------
  // Trending topics
  // -----------------------
  const trendingMap = Array.isArray(posts)
    ? posts.reduce((acc, p) => {
        const title = p.title || "General";
        acc[title] = (acc[title] || 0) + 1;
        return acc;
      }, {})
    : [];

  const trending = Object.entries(trendingMap)
    .map(([title, count]) => ({ title, posts: count }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 5);

  if (loading) return <p className="text-center mt-10">Loading posts...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 mt-14">
          <h1 className="text-4xl font-bold">Community Support Forum</h1>
          <p className="text-gray-500">
            Connect with fellow students in a safe, anonymous, and supportive environment
          </p>
          <button
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
            onClick={() => navigate("/chat")}
          >
            1-1 Anonymous Conversation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Post Input */}
            <div className="bg-white rounded-2xl shadow p-4 space-y-3">
              <input
                type="text"
                placeholder="Post Title"
                className="w-full border px-2 py-1 rounded-md outline-none"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                placeholder="Share your thoughts..."
                className="w-full border px-2 py-1 rounded-md outline-none"
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                onClick={handleCreatePost}
              >
                Post
              </button>
            </div>

            {/* Existing Posts with Pagination */}
            {paginatedPosts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow p-6 space-y-2">
                {/* ...existing post rendering code... */}
                {/* User info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaUserCircle className="text-2xl text-gray-400" />
                    <span className="font-semibold">
                      {/* Add [mod] if not student */}
                      {post.role && post.role !== "student" ? "[mod] " : ""}
                      Anonymous
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Post content */}
                <p className="text-gray-700">
                  <span className="text-xs text-purple-500 mr-2">#{post.title}</span>
                  {post.content}
                </p>

                {/* Post actions */}
                <div className="flex items-center space-x-6 text-gray-500 pt-2">
                  {/* Like */}
                  <span
                    className="flex items-center space-x-1 cursor-pointer hover:text-purple-600 transition"
                    onClick={() => handleLike(post._id)}
                  >
                    <FaHeart /> <span>{post.likes}</span>
                  </span>

                  {/* Public replies */}
                  <span
                    className="flex items-center space-x-1 cursor-pointer hover:text-purple-600 transition"
                    onClick={() =>
                      setOpenComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))
                    }
                  >
                    <FaComment /> <span>{post.replies?.length || 0}</span>
                  </span>

                  {/* Reply Privately */}
                  <span
                    className="flex items-center space-x-1 cursor-pointer hover:text-purple-600 transition"
                    onClick={() => setSelectedUser(post.user)}
                  >
                    <span>Reply Privately</span>
                  </span>
                </div>

                {/* Public replies section */}
                {openComments[post._id] && (
                  <div className="mt-3 space-y-2">
                    {post.replies?.map((r, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md"
                      >
                        <strong>{r.user}:</strong> {r.message}
                      </div>
                    ))}

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Reply publicly..."
                        className="flex-1 text-sm border px-2 py-1 rounded-md outline-none"
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post._id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => handleAddComment(post._id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600 transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">Page {page} of {totalPages}</span>
              <button
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-lg mb-4">Trending Topics</h2>
              <ul className="space-y-3">
                {trending.map((t, idx) => (
                  <li key={idx} className="flex justify-between">
                    <div>
                      <span className="text-gray-700">{t.title}</span>
                      <p className="text-xs text-gray-400">{t.posts} posts</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <FiShield className="text-red-500" />
                <span>Safe Space Guidelines</span>
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>👍 Be kind and supportive to everyone</li>
                <li>🔒 Respect privacy and anonymity</li>
                <li>💬 Share experiences, not personal details</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Private Message Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold">Reply Privately to {selectedUser}</h3>
              <textarea
                className="w-full border rounded-md p-2"
                rows={4}
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setSelectedUser(null);
                    setPrivateMessage("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600"
                  onClick={handlePrivateMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
