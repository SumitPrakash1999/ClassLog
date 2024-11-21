from flask import Blueprint, request, jsonify
import google.generativeai as genai
from datetime import datetime
from pymongo import MongoClient

quiz_route = Blueprint("quiz", __name__)
genai.configure(api_key='AIzaSyBUka-3AiP9K38EqJasE7b98SMMqNNgiH4')
model = genai.GenerativeModel('gemini-1.5-flash-latest')
MONGO_URI = "mongodb+srv://admin:admin@dsi.4l7dc.mongodb.net/?retryWrites=true&w=majority&appName=DSI"    

def create_db_connection():
    try:
        client = MongoClient(MONGO_URI)
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        return client
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")

def summarize_transcript_for_quiz(transcript, max_length=4000):
    """
    Summarize long transcripts while preserving key testable content.
    
    Args:
        transcript (str): Original transcript text
        max_length (int): Maximum desired length for the summary
        
    Returns:
        str: Summarized transcript focused on quiz-worthy content
    """
    if len(transcript) <= max_length:
        return transcript
        
    summary_prompt = f"""
    Please provide a concise summary of the following lecture transcript, 
    focusing specifically on key facts, concepts, and details that would be 
    appropriate for quiz questions:

    {transcript}
    
    Keep the summary focused on testable content.
    """
    
    response = model.generate_content(summary_prompt)
    return response.text

def create_quiz_prompt(user_prompt, transcript, last_quiz=None, max_prompt_length=8000):
    """
    Create an optimized prompt for Gemini API to generate quizzes.
    
    Args:
        user_prompt (str): User's specific requirements for the quiz
        transcript (str): Lecture transcript text
        last_quiz (str, optional): Previous version of the quiz if it exists
        max_prompt_length (int): Maximum allowed prompt length
        
    Returns:
        str: Formatted prompt string for the API
    """
    # Template for the quiz structure (moved to a constant to reduce repetition)
    QUIZ_STRUCTURE = """
    Please generate the quiz in Markdown format with the following structure:
    # Quiz Title
    ## Instructions
    [Instructions for the quiz]
    
    ## Questions
    1. [Question]
       - [ ] Option A
       - [ ] Option B
       - [ ] Option C
       - [ ] Option D
       
    [Include correct answers at the end]
    """

    if last_quiz:
        # For updates, only include relevant sections of previous quiz
        if len(last_quiz) > 2000:
            # Extract questions and answers from previous quiz
            last_quiz = last_quiz[:2000] + "\n...[Previous quiz truncated for brevity]..."
            
        base_prompt = f"""
        Generate a quiz based on the following requirements:
        
        USER REQUIREMENTS:
        {user_prompt}
        
        {QUIZ_STRUCTURE}
        
        PREVIOUS QUIZ:
        {last_quiz}
        
        Please create a new version of the quiz that integrates the requirement of the user.
        """
    else:
        # For new quizzes, potentially summarize the transcript
        processed_transcript = summarize_transcript_for_quiz(transcript) if len(transcript) > 4000 else transcript
        
        base_prompt = f"""
        Generate a quiz based on the following lecture transcript and requirements:
        
        LECTURE TRANSCRIPT:
        {processed_transcript}
        
        USER REQUIREMENTS:
        {user_prompt}
        
        {QUIZ_STRUCTURE}
        """
    
    # Final length check
    if len(base_prompt) > max_prompt_length:
        base_prompt = base_prompt[:max_prompt_length] + "\n...[Prompt truncated to meet length requirements]..."
    
    return base_prompt

@quiz_route.route("/quiz", methods=["POST"])
def gen_quiz():
    try:
        data = request.get_json()
        user_prompt = data.get("User_prompt")
        last_quiz = data.get("Last_quiz")
        transcript = data.get("Transcript")
        quiz_id = data.get("id")
        
        if not user_prompt or not transcript:
            return jsonify({
                "error": "Missing required fields",
                "message": "Both User_prompt and Transcript are required"
            }), 400
            
        # Handle very long transcripts by creating multiple question sets and combining them
        if len(transcript) > 12000:  # If transcript is extremely long
            quiz_sections = []
            chunk_size = 8000
            sections = len(transcript) // chunk_size + 1
            questions_per_section = max(10 // sections, 2)  # Ensure at least 2 questions per section
            
            for i in range(0, len(transcript), chunk_size):
                chunk = transcript[i:i + chunk_size]
                section_prompt = f"{user_prompt}\nPlease generate {questions_per_section} questions from this section."
                prompt = create_quiz_prompt(section_prompt, chunk)
                response = model.generate_content(prompt)
                quiz_sections.append(response.text)
            
            # Combine the sections
            combine_prompt = f"""
            Please combine these quiz sections into a single cohesive quiz, 
            ensuring there's no repetition and the questions flow logically:
            
            {' '.join(quiz_sections)}
            
            Maintain the same format and include all answers at the end.
            """
            final_response = model.generate_content(combine_prompt)
            quiz_content = final_response.text
        else:
            prompt = create_quiz_prompt(user_prompt, transcript, last_quiz)
            response = model.generate_content(prompt)
            quiz_content = response.text
        
        quiz_document = {
            "quiz_id": quiz_id,
            "quiz_content": quiz_content,
            "timestamp": datetime.utcnow()
        }
        
        client = create_db_connection()
        db = client.get_database('Dsi_project')
        quizzes_collection = db.quizzes
        
        if quizzes_collection.find_one({"quiz_id": quiz_id}):
            quizzes_collection.update_one(
                {"quiz_id": quiz_id},
                {"$set": {
                    "quiz_content": quiz_content,
                    "timestamp": datetime.utcnow()
                }}
            )
        else:
            quizzes_collection.insert_one(quiz_document)

        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "quiz_content": quiz_content,
            "metadata": {
                "model_used": "gemini-1.5-flash",
                "processed_length": len(transcript),
                "is_update": bool(last_quiz),
                "sections_processed": len(quiz_sections) if len(transcript) > 12000 else 1
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Quiz generation failed",
            "message": str(e)
        }), 500
    
@quiz_route.route("/get_quiz", methods=["GET"])
def get_quiz():
    """
    Retrieve a previously generated quiz from the database by quiz ID.
    """
    try:
        quiz_id = request.args.get("id")
        # Connect to the database
        client = create_db_connection()
        db = client.get_database('Dsi_project')
        quizzes_collection = db.quizzes

        # Fetch the quiz by ID
        quiz_document = quizzes_collection.find_one({"quiz_id": quiz_id})

        if not quiz_document:
            return jsonify({
                "status": "not_found",
                "message": "No quiz found for the given ID."
            }), 404

        return jsonify({
            "status": "success",
            "quiz_content": quiz_document.get("quiz_content"),
            "timestamp": quiz_document.get("timestamp")
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve quiz",
            "message": str(e)
        }), 500