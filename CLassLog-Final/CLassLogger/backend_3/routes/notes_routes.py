from flask import Blueprint, request, jsonify
import google.generativeai as genai
from datetime import datetime
from pymongo import MongoClient

notes_route = Blueprint("notes", __name__)

genai.configure(api_key='AIzaSyBUka-3AiP9K38EqJasE7b98SMMqNNgiH4')
model = genai.GenerativeModel('gemini-1.5-flash')
MONGO_URI = "mongodb+srv://admin:admin@dsi.4l7dc.mongodb.net/?retryWrites=true&w=majority&appName=DSI"    

def create_db_connection():
    try:
        client = MongoClient(MONGO_URI)
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        return client
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")

def summarize_transcript(transcript, max_length=4000):
    """
    Summarize long transcripts to a manageable length.
    
    Args:
        transcript (str): Original transcript text
        max_length (int): Maximum desired length for the summary
        
    Returns:
        str: Summarized transcript
    """
    if len(transcript) <= max_length:
        return transcript
        
    summary_prompt = f"""
    Please provide a concise summary of the following lecture transcript, 
    focusing on the main concepts and key points:

    {transcript}
    
    Keep the summary informative but brief.
    """
    
    response = model.generate_content(summary_prompt)
    return response.text

def create_notes_prompt(user_prompt, transcript, last_notes=None, max_prompt_length=8000):
    """
    Create an optimized prompt for Gemini API to generate lecture notes.
    
    Args:
        user_prompt (str): User's specific requirements for the notes
        transcript (str): Lecture transcript text
        last_notes (str, optional): Previous version of the notes if it exists
        max_prompt_length (int): Maximum allowed prompt length
        
    Returns:
        str: Formatted prompt string for the API
    """
    # Template for the notes structure (moved to a constant to reduce repetition)
    NOTES_STRUCTURE = """
    Please generate the notes in Markdown format with the following structure:
    # [Topic Title]
    
    ## Overview
    [Brief summary of main concepts]
    
    ## Key Concepts
    [Main points broken down with explanations]
    
    ## Examples & Illustrations
    [Relevant examples, code snippets, or illustrations]
    
    ## Summary
    [Concise summary of the most important points]
    
    ## Additional Resources
    [Suggested readings or references]
    
    Note: Use appropriate Markdown formatting including:
    - Headers (##, ###)
    - Bullet points
    - Code blocks (```)
    - Tables where appropriate
    - Bold and italic text for emphasis
    """

    if last_notes:
        # For updates, only include relevant sections of previous notes
        if len(last_notes) > 2000:
            last_notes = last_notes[:2000] + "\n...[Previous notes truncated for brevity]..."
            
        base_prompt = f"""
        Generate comprehensive lecture notes based on the following requirements:
        
        USER REQUIREMENTS:
        {user_prompt}
        
        {NOTES_STRUCTURE}
        
        PREVIOUS NOTES (Key sections):
        {last_notes}
        
        Please create a new version of the notes that integrates the requirement of the user.
        """
    else:
        # For new notes, potentially summarize the transcript
        processed_transcript = summarize_transcript(transcript) if len(transcript) > 4000 else transcript
        
        base_prompt = f"""
        Generate comprehensive lecture notes based on the following transcript and requirements:
        
        LECTURE TRANSCRIPT:
        {processed_transcript}
        
        USER REQUIREMENTS:
        {user_prompt}
        
        {NOTES_STRUCTURE}
        """
    
    # Final length check
    if len(base_prompt) > max_prompt_length:
        base_prompt = base_prompt[:max_prompt_length] + "\n...[Prompt truncated to meet length requirements]..."
    
    return base_prompt

@notes_route.route("/notes", methods=["POST"])
def gen_notes():
    try:
        data = request.get_json()
        user_prompt = data.get("User_prompt")
        last_notes = data.get("Last_notes")
        transcript = data.get("Transcript")
        notes_id = data.get("id")

        if not user_prompt or not transcript:
            return jsonify({
                "error": "Missing required fields",
                "message": "Both User_prompt and Transcript are required"
            }), 400
        
        # Handle very long inputs in chunks if necessary
        if len(transcript) > 12000:  # If transcript is extremely long
            notes_sections = []
            chunk_size = 8000
            for i in range(0, len(transcript), chunk_size):
                chunk = transcript[i:i + chunk_size]
                prompt = create_notes_prompt(user_prompt, chunk)
                response = model.generate_content(prompt)
                notes_sections.append(response.text)
            
            # Combine the sections
            combine_prompt = f"""
            Please combine and organize these note sections into a cohesive document:
            
            {' '.join(notes_sections)}
            """
            final_response = model.generate_content(combine_prompt)
            notes_content = final_response.text
        else:
            prompt = create_notes_prompt(user_prompt, transcript, last_notes)
            response = model.generate_content(prompt)
            notes_content = response.text

        notes_document = {
            "notes_id": notes_id,
            "notes_content": notes_content
        }
        
        client = create_db_connection()
        db = client.get_database('Dsi_project')
        notes_collection = db.notes
        
        if notes_collection.find_one({"notes_id": notes_id}):
            notes_collection.update_one(
                {"notes_id": notes_id},
                {"$set": {"notes_content": notes_content}}
            )
        else:
            notes_collection.insert_one(notes_document)

        return jsonify({
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "notes_content": notes_content,
            "metadata": {
                "model_used": "gemini-1.5-flash",
                "processed_length": len(transcript)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Notes generation failed",
            "message": str(e)
        }), 500
    
@notes_route.route("/get_notes", methods=["GET"])
def get_notes():
    """
    Retrieve previously generated notes from the database by notes ID.
    """
    try:
        notes_id = request.args.get("id")

        # Connect to the database
        client = create_db_connection()
        db = client.get_database('Dsi_project')
        notes_collection = db.notes

        # Fetch the notes by ID
        notes_document = notes_collection.find_one({"notes_id": notes_id})

        if not notes_document:
            return jsonify({
                "status": "not_found",
                "message": "No notes found for the given ID."
            }), 404

        return jsonify({
            "status": "success",
            "notes_content": notes_document.get("notes_content"),
            "timestamp": notes_document.get("timestamp")
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to retrieve notes",
            "message": str(e)
        }), 500
