import React, { useEffect, useState } from "react";

export default function CounselorBooking() {
  const [psychologists, setPsychologists] = useState([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("30"); // default 30 mins
  const [message, setMessage] = useState("");
  const appUrl = import.meta.env.VITE_APP_URL;


  // ✅ inline helper functions
  const getStoredUser = () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (err) {
      console.error("Error parsing stored user:", err);
      return null;
    }
  };

  const getToken = () => {
    const t = localStorage.getItem("token");
    if (!t || t === "null" || t === "undefined") return null;
    return t;
  };

  const user = getStoredUser();
  const token = getToken();

  // Fetch psychologists from backend
  useEffect(() => {
    const fetchPsychologists = async () => {
      if (!token) {
        alert("You must be logged in to view psychologists.");
        return;
      }
      try {
        const res = await fetch(`${appUrl}/api/users?role=psychologist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPsychologists(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching psychologists:", err);
        setPsychologists([]);
      }
    };
    fetchPsychologists();
  }, [token]);

  const handleBook = async () => {
    if (!selectedPsychologist || !selectedDate || !selectedTime) {
      alert("Please select psychologist, date, and time");
      return;
    }

    if (!user || user.role !== "student") {
      alert("Only students can book an appointment");
      return;
    }

    try {
      const appointmentTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

      const res = await fetch(`${appUrl}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          psychologistId: selectedPsychologist._id,
          appointmentTime,
          duration,
        }),
      });

      const data = await res.json();

      if (res.ok && data._id) {
        alert(
          `✅ Appointment confirmed with ${selectedPsychologist.name} at ${new Date(
            data.appointmentTime
          ).toLocaleString()} for ${data.duration} mins`
        );
        setSelectedPsychologist(null);
        setSelectedDate("");
        setSelectedTime("");
        setDuration("30");
        setMessage("");
      } else {
        alert(`❌ Booking failed: ${data.error || "Try another slot"}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Network error. Please try again later.");
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 py-10" id="book">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900">Book a Professional Counselor</h2>
          <p className="text-gray-600 text-base max-w-2xl mx-auto mt-2">
            Connect with licensed mental health professionals who understand student life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Psychologist List */}
          <div>
            <h5 className="text-lg font-semibold mb-4">Choose Your Counselor</h5>
            {psychologists.length === 0 ? (
              <p className="text-gray-500">No psychologists available.</p>
            ) : (
              psychologists.map((doc) => (
                <div
                  key={doc._id}
                  className={`flex justify-between items-center p-4 mb-4 border rounded-xl bg-white shadow-sm ${
                    selectedPsychologist === doc ? "border-indigo-500" : "border-gray-200"
                  }`}
                >
                  <div>
                    <h6 className="font-semibold text-gray-900 mb-1">{doc.name}</h6>
                    <p className="text-sm text-gray-600 mb-1">
                      {doc.expertise || "Expert in mental health"}
                    </p>
                    <p className="text-xs text-gray-500">{doc.email}</p>
                  </div>
                  <button
                    className="border border-indigo-500 text-indigo-500 hover:bg-indigo-50 px-3 py-1.5 rounded text-sm"
                    onClick={() => setSelectedPsychologist(doc)}
                  >
                    {selectedPsychologist === doc ? "Selected" : "Select"}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Schedule Section */}
          <div>
            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              <h5 className="text-lg font-semibold mb-4">Schedule Your Session</h5>

              {/* Date */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Time */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                </select>
              </div>

              {/* Message */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  placeholder="Share what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Book Button */}
              <div className="mt-6">
                <button
                  onClick={handleBook}
                  className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:opacity-90 transition"
                >
                  📅 Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
