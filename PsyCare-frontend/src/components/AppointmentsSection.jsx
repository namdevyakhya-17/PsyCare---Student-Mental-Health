import React, { useState, useEffect } from "react";
import LoginPrompt from "./ui/loginPrompt";
import { Dialog, DialogContent } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const appUrl = import.meta.env.VITE_APP_URL;

  const navigate = useNavigate();
  const getStoredUserRole = () => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) return null;
      const user = JSON.parse(userString);
      return user?.role || null;
    } catch (err) {
      console.error("Error parsing stored user:", err);
      return null;
    }
  };
  const role = getStoredUserRole();
  const token = localStorage.getItem("token");

  // ---------------- Fetch appointments ----------------
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${appUrl}/api/appointments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        setError("unauthorized");
        return;
      }
      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      const formatted = data.data.map((appt) => {
        const therapist = appt.psychologistId;
        const dt = new Date(appt.appointmentTime);
        return {
          _id: appt._id,
          name: therapist.name,
          email: therapist.email,
          date: dt.toLocaleDateString(),
          time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: appt.duration,
          status: appt.status,
          meetingCode: appt.meetingCode,
          appointmentTime: dt,
        };
      });
      setAppointments(formatted);
    } catch (err) {
      console.error(err);
      setError("network");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAppointments().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Cancel appointment ----------------
  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${appUrl}/api/appointments/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        return;
      }
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Clear all appointments ----------------
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all appointments? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${appUrl}/api/appointments/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error("Failed to clear appointments");
      setAppointments([]);
    } catch (err) {
      console.error(err);
      alert("Error clearing appointments. Try again later.");
    }
  };

  // ---------------- Start meeting ----------------
  const handleStartMeeting = (appt) => {
    if (appt.status === "cancelled") {
      setPopupMessage(
        "⚠️ This appointment has been cancelled.\n" +
          "If you want to reschedule or need assistance, " +
          "please contact support or book a new session."
      );
      setShowPopup(true);
      return;
    }

    const now = new Date();
    const start = new Date(appt.appointmentTime);
    const duration = appt.duration || 60;
    const end = new Date(start.getTime() + duration * 60000);

    if (now < start) {
      setPopupMessage("Meeting has not started yet. ⏰");
      setShowPopup(true);
      return;
    }
    if (now >= end) {
      setPopupMessage("This meeting has already ended. 🙁");
      setShowPopup(true);
      return;
    }
    if (!appt.meetingCode) {
      setPopupMessage("Meeting code not found. Please contact support.");
      setShowPopup(true);
      return;
    }
    setPopupMessage(`Starting meeting: ${appt.meetingCode}... 🚀`);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
      navigate(`/${appt.meetingCode}`);
    }, 1500);
  };

  const colorClasses = {
    pending: "bg-orange-100 text-orange-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // ---------------- UI ----------------
  return (
    <div className="relative min-h-screen bg-gray-50" id="appointments">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Your Appointments</h1>
          <p className="text-gray-600 text-sm">Manage your counseling sessions and track your mental health journey</p>
        </div>

        {loading && <p className="text-center text-gray-500">Loading appointments...</p>}

        {!loading && error === "unauthorized" && (
          <p className="text-center text-gray-500">Please login to see your appointments.</p>
        )}

        {!loading && error === "network" && (
          <p className="text-center text-red-500">⚠ Unable to fetch appointments. Try again later.</p>
        )}

        <div className="space-y-4">
          {appointments.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-medium ${
                    colorClasses[s.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {s.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                <span>📅 {s.date}</span>
                <span>🕑 {s.time}</span>
                <span>⏱ {s.duration} mins</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => handleCancel(s._id)}
                  className="px-3 py-1 rounded-md text-xs border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartMeeting(s)}
                  className="px-3 py-1 rounded-md text-xs border border-blue-600 bg-blue-100 text-blue-700 hover:bg-blue-200 ml-2"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Clear All Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleClearAll}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Clear All Appointments
          </button>
        </div>
      </div>

      {/* Login prompt */}
      {showLoginPrompt && (
        <LoginPrompt
          onLogin={() => (window.location.href = "/login")}
          onSignup={() => (window.location.href = "/signup")}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}

      {/* Popup dialog */}
      <Dialog
        open={showPopup}
        onClose={() => setShowPopup(false)}
        PaperProps={{
          style: {
            padding: "20px 30px",
            textAlign: "center",
            borderRadius: "20px",
          },
        }}
      >
        <DialogContent>
          <p className="text-lg font-semibold text-gray-800">{popupMessage}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
