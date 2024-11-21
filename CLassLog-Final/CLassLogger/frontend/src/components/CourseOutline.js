import React, { useState, useEffect } from "react";
import { useNavigate, useParams  } from "react-router-dom";

const CourseOutline = () => {
  const [chapters, setChapters] = useState([]);
  const [newChapter, setNewChapter] = useState({ name: "", total_lectures: "" });
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(null);
  const [newTopic, setNewTopic] = useState({
    name: "",
    description: "",
    number_of_lectures: "",
  });

  const [editingChapterIndex, setEditingChapterIndex] = useState(null);
  const [editingTopicIndex, setEditingTopicIndex] = useState(null);
  const [editChapter, setEditChapter] = useState(null);
  const [editTopic, setEditTopic] = useState(null);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // New state variables for lectures and subject ID
  const [lectures, setLectures] = useState([]);
  const [newLectureNumber, setNewLectureNumber] = useState("");
  // const [subjectId, setSubjectId] = useState("subject1"); // Replace with actual subject ID
  const { subjectId } = useParams(); 


  useEffect(() => {
    fetchChapters();
    fetchLectures();
  }, []);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/chapters/${subjectId}`); // Include subjectId in the URL
      if (!response.ok) {
        throw new Error("Failed to fetch chapters");
      }
      const data = await response.json();
      setChapters(data);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch lectures for the current subject
  const fetchLectures = async () => {
    try {
      const response = await fetch(`http://localhost:5000/lectures/${subjectId}`);
      const data = await response.json();
      // Sort lectures by lecture number
      data.sort((a, b) => a.lecture_number - b.lecture_number);
      setLectures(data);
    } catch (error) {
      console.error("Error fetching lectures:", error);
    }
  };

  // Navigate to the lecture plan page
 // Navigate to the lecture plan page using lecture ID
  const goToLecturePlan = (lectureId) => {
    navigate(`/lecture/${lectureId}`);
  };

  // Handle adding a new lecture
  const addLecture = async () => {
    if (newLectureNumber.trim()) {
      const lectureData = {
        lecture_number: newLectureNumber,
        subject_id: subjectId,
      };
      try {
        const response = await fetch("http://localhost:5000/lecture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lectureData),
        });
  
        if (!response.ok) {
          throw new Error("Failed to add lecture");
        }
  
        const addedLecture = await response.json();
        // Update the lectures state and sort them
        setLectures((prevLectures) =>
          [...prevLectures, addedLecture].sort((a, b) => a.lecture_number - b.lecture_number)
        );
        setNewLectureNumber("");
      } catch (error) {
        console.error("Error adding lecture:", error);
        alert("An error occurred while adding the lecture. Please try again.");
      }
    } else {
      alert("Please enter a lecture number");
    }
  };
  

  // Handle adding a new chapter
  const addChapter = async () => {
    if (newChapter.name.trim() && newChapter.total_lectures) {
      try {
        // Include subjectId in the chapter data
        const chapterData = { ...newChapter, subject_id: subjectId };
  
        const response = await fetch("http://localhost:5000/chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chapterData),
        });
  
        if (!response.ok) {
          throw new Error("Failed to add chapter");
        }
  
        const addedChapter = await response.json();
        setChapters([...chapters, { ...addedChapter, topics: [] }]);
        setNewChapter({ name: "", total_lectures: "" });
        setSelectedChapterIndex(chapters.length); // Automatically select the newly added chapter
      } catch (error) {
        console.error("Error adding chapter:", error);
      }
    } else {
      alert("Please fill out all required fields.");
    }
  };
  
  // Handle deleting a chapter
  const deleteChapter = async (index) => {
    const chapterId = chapters[index].id;
    try {
      await fetch(`http://localhost:5000/chapter/${chapterId}`, {
        method: "DELETE",
      });
      const updatedChapters = chapters.filter((_, i) => i !== index);
      setChapters(updatedChapters);
      setSelectedChapterIndex(null);
    } catch (error) {
      console.error("Error deleting chapter:", error);
    }
  };

  // Handle editing a chapter
  const startEditingChapter = (index) => {
    setEditingChapterIndex(index);
    setEditChapter({ ...chapters[index] });
  };

  const saveEditedChapter = async () => {
    const chapterId = chapters[editingChapterIndex].id;
    try {
      const response = await fetch(`http://localhost:5000/chapter/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editChapter),
      });
      if (!response.ok) {
        throw new Error("Failed to update chapter");
      }
      const updatedChapters = [...chapters];
      updatedChapters[editingChapterIndex] = { ...editChapter };
      setChapters(updatedChapters);
      setEditingChapterIndex(null);
      setEditChapter(null);
    } catch (error) {
      console.error("Error updating chapter:", error);
    }
  };

  const cancelEditChapter = () => {
    setEditingChapterIndex(null);
    setEditChapter(null);
  };

  // Handle selecting a chapter and fetching its topics
  const selectChapter = async (index) => {
    setSelectedChapterIndex(index);
    const chapterId = chapters[index].id;
    try {
      const response = await fetch(`http://localhost:5000/topics/${chapterId}`);
      const topics = await response.json();
      const updatedChapters = [...chapters];
      updatedChapters[index].topics = topics;
      setChapters(updatedChapters);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  // Handle adding a new topic to the selected chapter
  const addTopicToChapter = async () => {
    if (selectedChapterIndex !== null) {
      const chapter = chapters[selectedChapterIndex];
      const chapterId = chapter.id;

      // Construct the topic data
      const topicData = {
        chapter_id: chapterId,
        name: newTopic.name,
        description: newTopic.description,
        number_of_lectures: newTopic.number_of_lectures,
        Status: "Incomplete",
      };

      try {
        const response = await fetch("http://localhost:5000/topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(topicData),
        });

        if (!response.ok) {
          throw new Error("Failed to add topic");
        }

        // Instead of updating state manually, re-fetch the topics
        await selectChapter(selectedChapterIndex);

        setNewTopic({ name: "", description: "", number_of_lectures: "" });
        alert("Topic added successfully!");
      } catch (error) {
        console.error("Error adding topic:", error);
        alert("An error occurred while adding the topic. Please try again.");
      }
    } else {
      console.error("No chapter selected");
      alert("Please select a chapter first.");
    }
  };

  // Handle deleting a topic
  const deleteTopic = async (chapterIndex, topicIndex) => {
    const topicId = chapters[chapterIndex].topics[topicIndex].id;
    try {
      await fetch(`http://localhost:5000/topic/${topicId}`, {
        method: "DELETE",
      });
      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex].topics = updatedChapters[chapterIndex].topics.filter(
        (_, i) => i !== topicIndex
      );
      setChapters(updatedChapters);
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  // Handle editing a topic
  const startEditingTopic = (chapterIndex, topicIndex) => {
    setEditingTopicIndex(topicIndex);
    setEditTopic({ ...chapters[chapterIndex].topics[topicIndex] });
  };

  const saveEditedTopic = async (chapterIndex) => {
    const topicId = chapters[chapterIndex].topics[editingTopicIndex].id;
    try {
      const response = await fetch(`http://localhost:5000/topic/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTopic),
      });
      if (!response.ok) {
        throw new Error("Failed to update topic");
      }
      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex].topics[editingTopicIndex] = { ...editTopic };
      setChapters(updatedChapters);
      setEditingTopicIndex(null);
      setEditTopic(null);
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  const cancelEditTopic = () => {
    setEditingTopicIndex(null);
    setEditTopic(null);
  };

  // Handle input changes for chapters and topics
  const handleChapterInputChange = (e) => {
    const { name, value } = e.target;
    setNewChapter({ ...newChapter, [name]: value });
  };

  const handleEditChapterInputChange = (e) => {
    const { name, value } = e.target;
    setEditChapter({ ...editChapter, [name]: value });
  };

  const handleTopicInputChange = (e) => {
    const { name, value } = e.target;
    setNewTopic({ ...newTopic, [name]: value });
  };

  const handleEditTopicInputChange = (e) => {
    const { name, value } = e.target;
    setEditTopic({ ...editTopic, [name]: value });
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  const updateTopicStatus = async (chapterIndex, topicIndex, status) => {
    const topicId = chapters[chapterIndex].topics[topicIndex].id;
  
    try {
      const response = await fetch(`http://localhost:5000/topic/${topicId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: status }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update topic status");
      }
  
      // Update the topic's status locally or re-fetch the chapter's topics
      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex].topics[topicIndex].Status = status;
      setChapters(updatedChapters);
  
      alert(`Topic marked as ${status}`);
    } catch (error) {
      console.error("Error updating topic status:", error);
      alert("An error occurred while updating the topic status.");
    }
  };
  const toggleTopicStatus = async (chapterIndex, topicIndex, currentStatus) => {
    const topicId = chapters[chapterIndex].topics[topicIndex].id;
    const newStatus = currentStatus === "Incomplete" ? "Completed" : "Incomplete";
  
    try {
      const response = await fetch(`http://localhost:5000/topic/${topicId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update topic status");
      }
  
      // Update the topic's status locally or re-fetch the chapter's topics
      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex].topics[topicIndex].Status = newStatus;
      setChapters(updatedChapters);
  
      alert(`Topic marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating topic status:", error);
      alert("An error occurred while updating the topic status.");
    }
  };
  

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "purple" }}>ClassLog</h1>
      {/* <h2 style={{ textAlign: "center" }}>Mathematics</h2> */}
      <h3 style={{ textAlign: "center" }}>Subject Course Outline</h3>

      {/* Add Chapter */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="name"
          placeholder="Chapter Name"
          value={newChapter.name}
          onChange={handleChapterInputChange}
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          name="total_lectures"
          placeholder="Number of Lectures"
          value={newChapter.total_lectures}
          onChange={handleChapterInputChange}
          style={{ marginRight: "10px" }}
        />
        <button
          onClick={addChapter}
          style={{ padding: "10px", backgroundColor: "purple", color: "white", border: "none" }}
        >
          Add Chapter
        </button>
      </div>

      {/* Chapters */}
      {chapters.map((chapter, chapterIndex) => (
        <div key={chapter.id} style={{ marginBottom: "20px", border: "1px solid #ddd", padding: "10px" }}>
          {editingChapterIndex === chapterIndex ? (
            <div>
              <input
                type="text"
                name="name"
                placeholder="Chapter Name"
                value={editChapter.name}
                onChange={handleEditChapterInputChange}
                style={{ marginRight: "10px" }}
              />
              <input
                type="number"
                name="total_lectures"
                placeholder="Number of Lectures"
                value={editChapter.total_lectures}
                onChange={handleEditChapterInputChange}
                style={{ marginRight: "10px" }}
              />
              <button onClick={saveEditedChapter} style={{ marginRight: "10px" }}>
                Save
              </button>
              <button onClick={cancelEditChapter}>Cancel</button>
            </div>
          ) : (
            <div>
              <h4
                onClick={() => selectChapter(chapterIndex)}
                style={{ cursor: "pointer", display: "inline-block", marginRight: "20px" }}
              >
                {chapter.name} ({chapter.total_lectures} Lectures)
              </h4>
              <button onClick={() => startEditingChapter(chapterIndex)} style={{ marginRight: "10px" }}>
                Edit
              </button>
              <button onClick={() => deleteChapter(chapterIndex)}>Delete</button>
            </div>
          )}

          {/* Topics */}
{selectedChapterIndex === chapterIndex && (
  <div>
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2", textAlign: "left" }}>
          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Name</th>
          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Description</th>
          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Number of Lectures</th>
          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
          <th style={{ padding: "10px", border: "1px solid #ddd" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {chapter.topics &&
          chapter.topics.map((topic, topicIndex) => (
            <tr key={topic.id}>
              <td>{topic.name}</td>
              <td>{topic.description}</td>
              <td>{topic.number_of_lectures}</td>
              <td>{topic.Status}</td>
              <td>
                <button
                  onClick={() =>
                    toggleTopicStatus(chapterIndex, topicIndex, topic.Status)
                  }
                  style={{
                    marginLeft: "5px",
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    padding: "5px",
                    cursor: "pointer",
                  }}
                >
                  {topic.Status === "Incomplete" ? "Mark as Completed" : "Mark as Incomplete"}
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>


              {/* Add Topic Form */}
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Topic Name"
                  value={newTopic.name}
                  onChange={handleTopicInputChange}
                  style={{ marginRight: "10px" }}
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={newTopic.description}
                  onChange={handleTopicInputChange}
                  style={{ marginRight: "10px" }}
                />
                <input
                  type="number"
                  name="number_of_lectures"
                  placeholder="Number of Lectures"
                  value={newTopic.number_of_lectures}
                  onChange={handleTopicInputChange}
                  style={{ marginRight: "10px" }}
                />
                <button
                  onClick={addTopicToChapter}
                  style={{ padding: "10px", backgroundColor: "purple", color: "white", border: "none" }}
                >
                  Add Topic
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Lecture Navigation */}
      <div style={{ marginTop: "20px" }}>
        <h3>Lecture Navigation</h3>
        <div>
          {lectures.map((lecture) => (
            <button
              key={lecture.id}
              onClick={() => goToLecturePlan(lecture.id)}
              style={{
                padding: "10px 20px",
                margin: "5px",
                backgroundColor: "purple",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Lecture {lecture.lecture_number}
            </button>
          ))}

        </div>
        {/* Add Lecture Form */}
        <div style={{ marginTop: "10px" }}>
          <input
            type="number"
            name="lecture_number"
            placeholder="Lecture Number"
            value={newLectureNumber}
            onChange={(e) => setNewLectureNumber(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <button
            onClick={addLecture}
            style={{
              padding: "10px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Add Lecture
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseOutline;
