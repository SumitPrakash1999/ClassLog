import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./UploadVideo.css";

const UploadVideo = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [transcript, setTranscript] = useState(""); // State to store the transcript string
  const { lectureId } = useParams(); // Get lectureId from the URL

  const handleFileChange = async (event) => {
    const videoFile = event.target.files[0];
    if (!videoFile) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("lecture_id", lectureId); // Append lectureId to the form data

      // Send POST request to backend
      console.log("HERE")
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResponseMessage(data.message || "File uploaded successfully!");

      // Handle transcript string if available
      if (data.transcript_file) {
        setTranscript(data.transcript_file);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      setResponseMessage("Failed to upload video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <h3 className="lecture">Lecture - {lectureId}</h3>

      <div className="upload-box">
        <input
          type="file"
          accept="video/*"
          id="fileInput"
          className="file-input"
          onChange={handleFileChange}
        />
        <label htmlFor="fileInput" className="file-label">
          <i className="fas fa-upload"></i> Drag and drop or browse files
        </label>
      </div>

      <button
        className="process-button"
        disabled={isProcessing}
        onClick={() => document.getElementById("fileInput").click()}
      >
        {isProcessing ? "Processing..." : "Upload Video"}
      </button>

      {responseMessage && (
        <div className="response-message">
          <p>{responseMessage}</p>
        </div>
      )}

      {transcript && (
        <div className="transcript-box">
          <h3>Transcript</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
