import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoginPrompt from "./ui/loginPrompt";

const AIChatSection = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi 👋, I'm PsyCare. How are you feeling today?" },
  ]);
  const [locationConsent, setLocationConsent] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [lang, setLang] = useState("en"); // default language
  const token = localStorage.getItem("token");
  const appUrl = import.meta.env.VITE_APP_URL;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // If location consent not given, send message first, then handle SOS after consent
  let location = null;
  let escalateDetected = false;
  let emergencyMessage = "";
  let hotlines = [];
  let therapists = [];
    try {
      const response = await fetch(`${appUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: input, lang }),
        credentials: "include",
      });

      if (response.status === 401) {
        // Only show login prompt if token is truly missing or expired
        if (!token) {
          setShowLoginPrompt(true);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "Session expired or invalid. Please log in again." },
          ]);
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Error: ${response.statusText}` },
        ]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // ✅ Suicidal / emergency handling
      if (data.escalate) {
        escalateDetected = true;
        emergencyMessage = data.emergencyMessage;
        hotlines = data.hotlines || [];
        therapists = data.therapists || [];

        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: emergencyMessage },
        ]);

        hotlines.forEach((h) => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `Hotline: ${h.name} - ${h.phone || h.website}`,
            },
          ]);
        });

        therapists.forEach((t) => {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `Available Therapist: ${t.name} (${t.email})`,
            },
          ]);
        });

        // Show location popup
        setShowLocationPopup(true);
      }

      // ✅ Booking handling
      else if (data.bookingSuccess !== undefined) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.message }]);

        if (data.appointment) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: `Appointment Details:\nTherapist ID: ${
                data.appointment.psychologistId
              }\nStudent ID: ${data.appointment.studentId}\nTime: ${new Date(
                data.appointment.appointmentTime
              ).toLocaleString()}\nStatus: ${data.appointment.status}`,
            },
          ]);
        }
      } else {
        // Format multi-line bot responses as bullet points if not already markdown
        let botText = data.reply || data.message || "Sorry, I didn’t understand.";
        if (botText.includes("\n") && !botText.trim().startsWith("- ")) {
          botText = botText
            .split("\n")
            .filter(line => line.trim())
            .map(line => `- ${line.trim()}`)
            .join("\n");
        }
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botText,
          },
        ]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Network or server error. Please try again later." },
      ]);
    }

    setLoading(false);
  };

  return (
    <section id="ai-chat" className="py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-poppins text-foreground">
            AI Chat Support
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Talk to our AI for instant guidance and coping strategies
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="flex justify-between items-center">
            {/* Assistant */}
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <span className="font-medium">PsyCare Assistant</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="border border-border rounded-md px-2 py-1 text-sm bg-background shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="bn">বাংলা</option>
                <option value="te">తెలుగు</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-64 bg-muted/30 rounded-md mb-4 p-4 overflow-auto text-sm">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 ${
                    msg.sender === "user"
                      ? "text-right text-foreground"
                      : "text-left text-muted-foreground"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.sender === "bot" ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="text-left text-muted-foreground">Typing...</div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={loading}>
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
              {/* Location consent UI */}
              {showLocationPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
                    <h3 className="text-lg font-semibold mb-2">Share Your Location</h3>
                    <p className="mb-4">To help you faster, please share your location with our support team.</p>
                    <Button
                      variant="default"
                      onClick={async () => {
                        setLocationConsent(true);
                        setShowLocationPopup(false);
                        if (navigator.geolocation) {
                          setLoading(true);
                          navigator.geolocation.getCurrentPosition(async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            setUserLocation(`${latitude},${longitude}`);
                            // Send location to backend for SOS
                            await fetch("https://psycare-dxmt.onrender.com/api/chat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({ message: input, lang, location: `${latitude},${longitude}` }),
                              credentials: "include",
                            });
                            setLoading(false);
                          }, () => {
                            setUserLocation(null);
                            setLoading(false);
                          }, { timeout: 10000 });
                        }
                      }}
                    >
                      Share My Location
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-2"
                      onClick={() => setShowLocationPopup(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <LoginPrompt
          onLogin={() => (window.location.href = "/auth")}
          onSignup={() => (window.location.href = "/auth")}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </section>
  );
};

export default AIChatSection;