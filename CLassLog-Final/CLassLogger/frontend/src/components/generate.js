import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useParams } from 'react-router-dom';
import { Download, FileText, Eye, EyeOff } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import rehypeRaw from 'rehype-raw'; // To render raw HTML in Markdown
import remarkGfm from 'remark-gfm'; // To render tables in Markdown
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import './PDFPreview.css';
import { Rings } from 'react-loader-spinner'; // Optional: Replace with your loader

const PDFPreview = ({ pdfFileName = 'file.md', heading }) => {
  const { lectureId } = useParams();
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [mdFileContent, setMdFileContent] = useState('');
  const [messages, setMessages] = useState([
    {
      text: `Hey Teach, Above is your current ${heading.toLowerCase()}. What changes would you like me to make?`,
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const preprocessContentForPageBreaks = (content) => {
    return content.replace(/(---PAGEBREAK---)/g, '<div style="page-break-before: always;"></div>');
  };

  const handleDownload = () => {
    const processedContent = preprocessContentForPageBreaks(mdFileContent);
    const htmlContent = marked(processedContent);

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    element.style.maxWidth = '800px';
    element.style.margin = '0 auto';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '12px';
    element.style.lineHeight = '1.5';

    const options = {
      margin: 10,
      filename: pdfFileName.replace('.md', '.pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0 },
      jsPDF: { unit: 'pt', orientation: 'portrait' },
    };

    html2pdf().from(element).set(options).save();
  };

  const renderers = {
    input: ({ type, checked, ...props }) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked || false} // Ensure controlled state
            readOnly // Prevent changes since it's a preview
            {...props}
          />
        );
      }
      return <input {...props} />;
    },
  };

  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  const getContent = async () => {
    setIsLoading(true); // Start loading
    try {
      // Dynamically select API based on heading
      const apiUrl =
        heading === "Generate Quiz"
          ? `http://localhost:8080/get_quiz?id=${lectureId}`
          : `http://localhost:8080/get_notes?id=${lectureId}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (heading === "Generate Quiz") {
          setMdFileContent(data.quiz_content);
        } else {
          setMdFileContent(data.notes_content);
        }
      } else {
        console.error("Failed to fetch content from API:", response.statusText);
      }
    } catch (error) {
      console.error("Error during API call:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);

    setIsLoading(true); // Start loading
    const apiData = {
      User_prompt: input,
      Transcript:
        ```Students will be able to:
          Define multiplication and explain its relationship to repeated addition.
          Demonstrate proficiency in multiplying whole numbers, including larger numbers and using different strategies.
          Multiply fractions accurately and explain the process.
          Understand and apply fractions as operators, interpreting them in real-world contexts.
          Activities:

          (I) Introduction to Multiplication (30 minutes)

          Activity 1: Real-world Examples (10 minutes): Begin with engaging real-world examples illustrating multiplication (e.g., buying multiple packs of cookies, calculating the total number of tiles needed for a floor). Use visual aids (pictures/videos). Encourage student participation through questioning.
          Activity 2: Repeated Addition (10 minutes): Connect multiplication to repeated addition using simple examples (e.g., 3 x 4 = 4 + 4 + 4). Use manipulatives (counters, blocks) if possible for visual learners.
          Activity 3: Multiplication Table Practice (10 minutes): Brief practice with multiplication tables (focus on the basics, up to 10 x 10). This can be done individually, in pairs, or as a whole class using a quick game or interactive whiteboard activity.
          (II) Multiplication of Whole Numbers (40 minutes)

          Activity 4: Basic Multiplication Practice (15 minutes): Practice multiplying larger whole numbers using different methods (e.g., standard algorithm, lattice multiplication – introduce and explain the latter briefly for varied approaches). Worksheet practice.
          Activity 5: Problem Solving (25 minutes): Present word problems requiring multiplication of whole numbers. Encourage students to show their work and explain their reasoning. Include problems with a range of difficulty levels.
          (III) Multiplication of Fractions (50 minutes)

          Activity 6: Visual Representation (15 minutes): Introduce fraction multiplication using visual aids (area models, diagrams) to demonstrate the concept clearly. Emphasize the understanding of multiplying numerators and denominators separately.
          Activity 7: Practice Problems (25 minutes): Guided practice multiplying fractions, including mixed numbers. Work through examples step-by-step on the board, addressing common errors. Worksheet practice incorporating different types of fractions.
          Activity 8: Simplifying Fractions (10 minutes): Focus on simplifying fractions after multiplication. Review techniques for finding the greatest common factor (GCF) and simplifying.
          (IV) Fraction as an Operator (40 minutes)

          Activity 9: Interpreting Fractions as Operators (15 minutes): Explain the concept of a fraction as an operator (e.g., ½ of 12 means multiplying 12 by ½). Use real-world examples (e.g., finding half the price of an item, calculating a fraction of a quantity).
          Activity 10: Problem Solving with Fractions as Operators (20 minutes): Present word problems requiring the application of fractions as operators. Encourage students to write out the equations and show their steps clearly. Include problems involving different types of fractions and whole numbers.
          Activity 11: Wrap-up and Q&A (5 minutes): Brief review of key concepts and address any remaining student questions.```,
          
      Last_quiz: mdFileContent,
      id:lectureId
    };

    try {
      const apiEndpoint =
        heading === "Generate Quiz"
          ? "http://localhost:8080/quiz"
          : "http://localhost:8080/notes";

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          ...newMessages,
          {
            text: `Here's the updated ${heading.toLowerCase()} based on your request.`,
            sender: "bot",
          },
        ]);
        if (heading === "Generate Quiz") {
          setMdFileContent(data.quiz_content);
        } else {
          setMdFileContent(data.notes_content);
        }
      } else {
        setMessages([
          ...newMessages,
          {
            text: "Sorry, I couldn't process your request. Please try again.",
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          text: "An error occurred while fetching the response. Please try again later.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false); // Stop loading
      setInput(''); // Clear input field
    }
  };

  useEffect(() => {
    getContent();
  }, []);

  return (
    <div className="pdf-preview-container">
      <div className="max-w-md mx-auto">
        <h1 className="heading">{heading}</h1>
        <Card className="pdf-card">
          <CardHeader className="pdf-card-header">
            <CardTitle className="pdf-card-title">{heading}</CardTitle>
            <div className="icon-buttons">
              <button
                onClick={togglePreview}
                className="icon-button"
                title={isPreviewVisible ? "Hide Preview" : "Show Preview"}
              >
                {isPreviewVisible ? <Eye className="icon" /> : <EyeOff className="icon" />}
              </button>
              <button onClick={handleDownload} className="icon-button" title="Download PDF">
                <Download className="icon" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="scrollable-container">
              {isPreviewVisible && (
                <div className="markdown-content pdf-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={renderers}
                  >
                    {mdFileContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Section */}
        <div className="chat-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-bubble ${message.sender === "bot" ? "assistant" : "user"}`}
            >
              <p>{message.text}</p>
            </div>
          ))}

          {/* Loader */}
          {isLoading && (
            <div className="loader-container">
              <Rings color="#00BFFF" height={80} width={80} />
            </div>
          )}

          {/* Input Field */}
          <div className="input-container">
            <input
              type="text"
              placeholder={`Message ${heading}`}
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} className="send-button">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
