import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const LecturePlan = () => {
  const { lectureId } = useParams(); // Get lecture ID from the URL
  const navigate = useNavigate();
  const [lecture, setLecture] = useState(null); // State to hold lecture details
  const [lecturePlan, setLecturePlan] = useState(""); // State to hold the lecture plan content
  const [editMode, setEditMode] = useState(false); // State to toggle edit mode
  const [loading, setLoading] = useState(true); // State to handle loading
  const [error, setError] = useState(null); // State to handle errors
  const [duration, setDuration] = useState(60); // State to specify lecture duration

  useEffect(() => {
    if (lectureId) {
      fetchLectureDetails();
    } else {
      setError("No lecture ID provided in the URL.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  // Fetch lecture details by lecture ID
  const fetchLectureDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/lecture/${lectureId}`);
      if (response.ok) {
        const data = await response.json();
        setLecture(data);
        fetchLecturePlan(data.id); // Fetch the lecture plan after getting lecture details
      } else if (response.status === 404) {
        setError("Lecture not found.");
        setLoading(false);
      } else {
        throw new Error("Failed to fetch lecture details.");
      }
    } catch (error) {
      console.error("Error fetching lecture details:", error);
      setError("An error occurred while fetching lecture details.");
      setLoading(false);
    }
  };

  // Fetch lecture plan by lecture ID
  const fetchLecturePlan = async (lectureId) => {
    try {
      const response = await fetch(`http://localhost:5000/dynamic-lectureplan/${lectureId}`);
      if (response.ok) {
        const data = await response.json();
        setLecturePlan(data.content);
      } else if (response.status === 404) {
        setLecturePlan(""); // If no lecture plan exists, initialize as empty
      } else {
        throw new Error("Failed to fetch lecture plan.");
      }
    } catch (error) {
      console.error("Error fetching lecture plan:", error);
      setError("An error occurred while fetching the lecture plan.");
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic lecture plan
  const generateDynamicLecturePlan = async () => {
    if (!lectureId) {
      console.error("Lecture ID not available");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/generate-dynamic-lectureplan/${lectureId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration }), // Send duration in the request body
      });
      if (response.ok) {
        const data = await response.json();
        setLecturePlan(data.content);
        alert("Lecture plan generated successfully!");
      } else {
        throw new Error("Failed to generate lecture plan.");
      }
    } catch (error) {
      console.error("Error generating lecture plan:", error);
      alert("An error occurred while generating the lecture plan.");
    }
  };

  // Save lecture plan after editing
  const saveLecturePlan = async () => {
    if (!lectureId) {
      console.error("Lecture ID not available");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/dynamic-lectureplan/${lectureId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: lecturePlan }),
      });
      if (response.ok) {
        setEditMode(false);
        alert("Lecture plan updated successfully!");
      } else {
        throw new Error("Failed to update lecture plan.");
      }
    } catch (error) {
      console.error("Error updating lecture plan:", error);
      alert("An error occurred while updating the lecture plan.");
    }
  };

  // Cancel editing and revert changes
  const cancelEdit = () => {
    setEditMode(false);
    if (lectureId) {
      fetchLecturePlan(lectureId); // Reload the lecture plan
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", color: "purple" }}>Lecture Plan</h1>
        <p style={{ textAlign: "center" }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center", color: "purple" }}>Lecture Plan</h1>
        <p style={{ textAlign: "center", color: "red" }}>{error}</p>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              backgroundColor: "purple",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Back to Course Outline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", marginTop: "20px", paddingTop: "60px", overflowX: "hidden"}}>
      <h1 style={{ textAlign: "center", color: "purple", marginBottom: "20px" }}>Lecture Plan</h1>
      {lecture && (
        <h2 style={{ textAlign: "center" }}>
          Lecture {lecture.lecture_number}: {lecture.title}
        </h2>
      )}

      {/* Dynamic Lecture Plan Generation */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <label htmlFor="duration" style={{ marginRight: "10px" }}>
          Duration (minutes):
        </label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ padding: "5px", marginRight: "10px", width: "80px" }}
        />
        <button
          onClick={generateDynamicLecturePlan}
          style={{
            padding: "10px 20px",
            backgroundColor: "purple",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "20px", 
          }}
        >
          Generate Lecture Plan
        </button>
      </div>

      {/* Lecture Plan Content */}
      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          padding: "20px",
          minHeight: "200px",
          maxHeight: "50vh", 
          overflowY: "auto",
        }}
      >
        <h3 style={{ color: "purple" }}>Lecture Plan Content</h3>
        {editMode ? (
          <textarea
            value={lecturePlan}
            onChange={(e) => setLecturePlan(e.target.value)}
            style={{ width: "100%", height: "200px", padding: "10px" }}
          />
        ) : (
          <ReactMarkdown>{lecturePlan || "No lecture plan available."}</ReactMarkdown>
        )}
      </div>

      {/* Edit and Save Buttons */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        {editMode ? (
          <>
            <button
              onClick={saveLecturePlan}
              style={{
                padding: "10px 20px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: "5px",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              style={{
                padding: "10px 20px",
                backgroundColor: "gray",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: lecturePlan ? "orange" : "gray",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: lecturePlan ? "pointer" : "not-allowed",
            }}
            disabled={!lecturePlan}
          >
            Edit Lecture Plan
          </button>
        )}
      </div>

      {/* Back to Dashboard */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "purple",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Generate Quiz */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={() => navigate(`/quiz/${lectureId}`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "purple",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generate Quiz
        </button>
      </div>

      {/* Generate Notes */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={() => navigate(`/notes/${lectureId}`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "purple",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generate Notes
        </button>
      </div>

     {/* Upload Class Video */}
<div style={{ textAlign: "center", marginTop: "10px" }}>
  <button
    onClick={() => navigate(`/upload/${lectureId}`)} // Navigate to the /upload/:lectureId page
    style={{
      padding: "10px 20px",
      backgroundColor: "purple",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    }}
  >
    Upload Class Video
  </button>
</div>

    </div>
  );
};

export default LecturePlan;
