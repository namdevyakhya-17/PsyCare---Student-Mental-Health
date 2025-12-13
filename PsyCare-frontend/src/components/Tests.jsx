import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({});
  const appUrl = import.meta.env.VITE_APP_URL;

  // read auth from localStorage
  const userId = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).id
    : null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    // fetch tests
    axios
      .get(`${appUrl}/api/tests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTests(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // fetch all reports for user
    if (userId) {
      axios
        .get(`${appUrl}/api/tests/user/${userId}/allreport`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const progressMap = {};
          if (res.data.reports) {
            res.data.reports.forEach((report) => {
              for (const [testId, scores] of Object.entries(report.progress)) {
                if (!progressMap[testId]) progressMap[testId] = [];
                progressMap[testId].push({ date: report.last_updated, scores });
              }
            });
          }
          setReports(progressMap);
        })
        .catch((err) => console.error(err));
    }
  }, [token, userId]);

  if (loading) {
    return (
      <p className="text-center mt-10 text-purple-700">
        Loading tests...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-200 via-purple-50 to-blue-100 flex flex-col items-center py-16 px-4">
      {/* Header */}
      <h2 className="text-4xl font-bold text-gray-900 mb-3 text-center font-serif">
        Wellness & Mental Health Tests
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl text-base md:text-lg leading-relaxed">
        Take a quick self-assessment to understand your mental wellness better.  
        Each card represents a different aspect of your well-being.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {tests.length === 0 && (
          <p className="text-center text-gray-700 col-span-full">
            No tests available.
          </p>
        )}

        {tests.map((test, idx) => {
          // get last score if available
          const scoresArr = reports[test._id]?.[0]?.scores || [];
          const lastScore =
            Array.isArray(scoresArr) && scoresArr.length > 0
              ? scoresArr[scoresArr.length - 1]
              : null;

          // try to split emoji from name if your API returns emoji in name
          const match = test.test_name.match(/(.)\s(.[\u{1F300}-\u{1FAFF}].)$/u);
          const name = match ? match[1] : test.test_name;
          const emoji = match ? match[2] : "🔖";

          return (
            <div
              key={test._id}
              className="
                bg-white/80 backdrop-blur-md rounded-3xl border border-violet-100 
                p-6 shadow-md hover:shadow-xl hover:-translate-y-1 
                transition-all duration-300 flex flex-col justify-between
              "
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-xl">
                  {emoji}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
                  <p className="text-sm text-gray-600">{test.description}</p>
                  {lastScore !== null && (
                    <p className="mt-1 text-xs text-gray-800">
                      Last Score:{" "}
                      <span className="font-semibold text-purple-700">{lastScore}</span>
                    </p>
                  )}
                </div>
              </div>
                    <div className="mt-5">
                      <Link
                        to={`/api/tests/${test._id}/questions`}
                  className="
                    inline-block w-full text-center px-4 py-2 rounded-lg 
                    bg-gradient-to-r from-purple-500 to-blue-500
                    text-white font-medium text-sm 
                    hover:from-violet-500 hover:to-violet-600 shadow transition
                  "
                >
                  Start the Test
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tests;