import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CourseOutline from "./components/CourseOutline";
import LecturePlan from "./components/LecturePlan";
import Dashboard from "./components/Dashboard"; // Assuming you have a Dashboard component
import PDFPreview from './components/generate';
import UploadVideo from "./components/UploadVideo";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courseOutline/:subjectId" element={<CourseOutline />} />
        <Route path="/lecture/:lectureId" element={<LecturePlan />} />
        <Route path="/quiz/:lectureId" element={<PDFPreview pdfFileName="Quiz.pdf" heading="Generate Quiz"/>} />
        <Route path="/notes/:lectureId" element={<PDFPreview pdfFileName="Notes.pdf" heading="Generate Notes"/>} />
        <Route path="/upload/:lectureId" element={<UploadVideo/>} />
      </Routes>
    </Router>
  );
}

export default App;
