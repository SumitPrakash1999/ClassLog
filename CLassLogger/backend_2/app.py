from flask import Flask, request, jsonify, make_response
from pymongo import MongoClient
# from flask import Flask
from flask_cors import CORS
import uuid
import os
import pdfkit
from markdown import markdown
import google.generativeai as genai
# Initialize Flask app
app = Flask(__name__)

CORS(app)
# MongoDB setup
client = MongoClient("mongodb+srv://admin:admin@dsi.4l7dc.mongodb.net/?retryWrites=true&w=majority&appName=DSI")
db = client["Dsi_project"]

# Collections
chapters_col = db.chapters
topics_col = db.topics
subjects_col = db.subjects
lectures_col = db.lectures


# Gemini API setup
GEMINI_API_KEY = "AIzaSyCAUmVVw4MX_uIFObZw0LYFBmj3iG9fQV8"  # Replace with your Gemini API key
genai.configure(api_key=GEMINI_API_KEY)

# Define the model
try:
    model = genai.GenerativeModel("gemini-1.5-flash")  # Specify the Gemini model to use
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    model = None

# ------------------ CHECk ------------------ #
@app.route('/', methods=['GET'])
def hello():
    str = "Hello World"
    return jsonify(str)

# ------------------ CHAPTERS API ------------------ #

@app.route('/chapters/<subject_id>', methods=['GET'])
def get_chapters_by_subject(subject_id):
    # Query the chapters collection to find all chapters with the specified subject_id
    chapters = list(chapters_col.find({'subject_id': subject_id}, {'_id': 0}))
    return jsonify(chapters)


@app.route('/chapter', methods=['POST'])
def add_chapter():
    data = request.json
    if 'name' in data and 'total_lectures' in data:
        # Generate a unique string ID
        data['id'] = str(uuid.uuid4())
        
        # Insert the chapter into the MongoDB collection
        result = chapters_col.insert_one(data)
        
        # Return the inserted document (excluding ObjectId)
        data['_id'] = str(result.inserted_id)  # Convert ObjectId to string for the response
        return jsonify(data), 201
    else:
        return jsonify({"error": "Invalid input"}), 400

@app.route('/chapter/<chapter_id>', methods=['GET'])    #works
def get_chapter_details(chapter_id):
    chapter = chapters_col.find_one({"id": chapter_id}, {'_id': 0})
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify(chapter)


@app.route('/chapter/<chapter_id>', methods=['PUT'])   #works
def edit_chapter(chapter_id):
    data = request.json
    result = chapters_col.update_one({"id": chapter_id}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify({"message": "Chapter updated successfully"})

@app.route('/chapter/<chapter_id>', methods=['DELETE'])  #works
def delete_chapter(chapter_id):
    result = chapters_col.delete_one({"id": chapter_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify({"message": "Chapter deleted successfully"})

# ------------------ TOPICS API ------------------ #


@app.route('/topics', methods=['GET'])  # Works
def get_all_topics():
    topics = list(topics_col.find({}, {'_id': 0}))
    return jsonify(topics)

@app.route('/topics/<chapter_id>', methods=['GET'])
def get_topics(chapter_id):
    topics = list(topics_col.find({"chapter_id": chapter_id}, {'_id': 0}))
    return jsonify(topics)

@app.route('/topic/<topic_id>', methods=['GET'])
def get_topic_details(topic_id):
    topic = topics_col.find_one({"id": topic_id}, {'_id': 0})
    if not topic:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify(topic)

@app.route('/topic', methods=['POST'])
def add_topic():
    data = request.json
    # Ensure that required fields are present
    if 'name' in data and 'number_of_lectures' in data and 'chapter_id' in data:
        # Generate a unique ID
        data['id'] = str(uuid.uuid4())
        # Insert into topics collection
        result = topics_col.insert_one(data)
        # Include the inserted ID in the response
        data['_id'] = str(result.inserted_id)
        return jsonify(data), 201
    else:
        return jsonify({"error": "Invalid input. 'name', 'number_of_lectures', and 'chapter_id' are required."}), 400

@app.route('/topic/<topic_id>', methods=['PUT'])
def edit_topic(topic_id):
    data = request.json
    # Only allow specific fields to be updated
    allowed_fields = {'name', 'number_of_lectures', 'chapter_id'}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        return jsonify({"error": "No valid fields to update."}), 400
    result = topics_col.update_one({"id": topic_id}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify({"message": "Topic updated successfully"})

@app.route('/topic/<topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    result = topics_col.delete_one({"id": topic_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify({"message": "Topic deleted successfully"})

# ------------------ SUBJECTS API ------------------ #

@app.route('/subjects', methods=['GET'])
def get_all_subjects():
    # Get the userId from query parameters
    user_id = request.args.get('userId')
    
    # If userId is not provided, return an error
    if not user_id:
        return jsonify({'error': 'userId parameter is required'}), 400
    
    # Find subjects belonging to the given userId
    subjects = list(subjects_col.find({'userId': user_id}, {'_id': 0}))
    
    # Return the filtered subjects
    return jsonify(subjects)

@app.route('/subject/<subject_id>', methods=['GET'])
def get_subject_details(subject_id):
    subject = subjects_col.find_one({"id": subject_id}, {'_id': 0})
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(subject)

@app.route('/subject', methods=['POST'])
def add_subject():
    data = request.json
    
    # Generate a unique ID using uuid
    data['id'] = str(uuid.uuid4())
    
    # Insert the subject into the collection
    subjects_col.insert_one(data)
    return jsonify({"message": "Subject added successfully", "id": data['id']}), 201


@app.route('/subject/<subject_id>', methods=['PUT'])
def edit_subject(subject_id):
    data = request.json
    result = subjects_col.update_one({"id": subject_id}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify({"message": "Subject updated successfully"})

@app.route('/subject/<subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    result = subjects_col.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify({"message": "Subject deleted successfully"})





@app.route('/getallIncompletetopics', methods=['GET'])
def get_all_incomplete_topics():
    pipeline = [
        {
            "$match": {
                "Status": "Incomplete"
            }
        },
        {
            "$lookup": {
                "from": "chapters",
                "localField": "chapter_id",
                "foreignField": "id",
                "as": "chapter_info"
            }
        },
        {
            "$unwind": "$chapter_info"
        },
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "name": 1,
                "number_of_lectures": 1,
                "chapter_id": 1,
                "Status": 1,
                "chapter_name": "$chapter_info.name"
            }
        }
    ]
    incomplete_topics = list(topics_col.aggregate(pipeline))
    return jsonify(incomplete_topics)

# ------------------ LECTURES API ------------------ #
@app.route('/lectures', methods=['GET'])
def get_all_lectures():
    lectures = list(lectures_col.find({}, {'_id': 0}))
    return jsonify(lectures)

@app.route('/lectures/<subject_id>', methods=['GET'])
def get_lectures_for_subject(subject_id):
    lectures = list(lectures_col.find({"subject_id": subject_id}, {'_id': 0}))
    return jsonify(lectures)

@app.route('/lecture/<lecture_id>', methods=['GET'])
def get_lecture_details(lecture_id):
    lecture = lectures_col.find_one({"id": lecture_id}, {'_id': 0})
    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404
    return jsonify(lecture)

@app.route('/lecture', methods=['POST'])
def add_lecture():
    data = request.json
    if 'lecture_number' in data and 'subject_id' in data:
        data['id'] = str(uuid.uuid4())
        result = lectures_col.insert_one(data)
        data['_id'] = str(result.inserted_id)
        return jsonify(data), 201
    else:
        return jsonify({"error": "Invalid input. 'lecture_number' and 'subject_id' are required."}), 400

@app.route('/lecture/<lecture_id>', methods=['PUT'])
def edit_lecture(lecture_id):
    data = request.json
    allowed_fields = {'lecture_number', 'subject_id'}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        return jsonify({"error": "No valid fields to update."}), 400
    result = lectures_col.update_one({"id": lecture_id}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({"error": "Lecture not found"}), 404
    return jsonify({"message": "Lecture updated successfully"})

@app.route('/lecture/<lecture_id>', methods=['DELETE'])
def delete_lecture(lecture_id):
    result = lectures_col.delete_one({"id": lecture_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Lecture not found"}), 404
    return jsonify({"message": "Lecture deleted successfully"})


# ------------------ GENERATE LECTURE PLAN API ------------------ #
@app.route('/generatelectureplan/<lecture_id>', methods=['GET'])
def generate_lecture_plan(lecture_id):
    # Check if the lecture exists
    lecture = lectures_col.find_one({"id": lecture_id})
    if not lecture:
        return jsonify({"error": "Lecture not found"}), 404

    # Fetch all incomplete topics
    pipeline = [
        {
            "$match": {
                "Status": "Incomplete"
            }
        },
        {
            "$lookup": {
                "from": "chapters",
                "localField": "chapter_id",
                "foreignField": "id",
                "as": "chapter_info"
            }
        },
        {
            "$unwind": "$chapter_info"
        },
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "name": 1,
                "number_of_lectures": 1,
                "chapter_id": 1,
                "Status": 1,
                "chapter_name": "$chapter_info.name"
            }
        }
    ]
    incomplete_topics = list(topics_col.aggregate(pipeline))

    # Create the lecture plan in Markdown format
    md_content = f"# Lecture Plan for Lecture {lecture_id}\n\n"
    md_content += "## Topics to be covered:\n\n"

    for topic in incomplete_topics:
        md_content += f"- **{topic['name']}** (Chapter: {topic['chapter_name']})\n"

    # Ensure the lecture plans folder exists
    lecture_plans_folder = "lecture plans"
    if not os.path.exists(lecture_plans_folder):
        os.makedirs(lecture_plans_folder)

    # File path
    file_path = os.path.join(lecture_plans_folder, f"{lecture_id}.md")

    # Write the markdown content to the file
    with open(file_path, "w", encoding='utf-8') as f:
        f.write(md_content)

    return jsonify({
        "message": "Lecture plan generated successfully",
        "file_path": file_path
    }), 200

# Endpoint to edit the content of a lecture plan
@app.route('/lectureplan/<lecture_id>', methods=['GET', 'PUT'])
def lecture_plan(lecture_id):
    lecture_plans_folder = "lecture plans"
    file_path = os.path.join(lecture_plans_folder, f"{lecture_id}.md")

    if request.method == 'GET':
        # Check if the file exists
        if not os.path.exists(file_path):
            return jsonify({"error": "Lecture plan not found"}), 404

        # Read the content of the file
        try:
            with open(file_path, "r", encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return jsonify({
            "lecture_id": lecture_id,
            "content": content
        }), 200

    elif request.method == 'PUT':
        # Existing PUT logic
        data = request.json
        if 'content' not in data:
            return jsonify({"error": "No content provided"}), 400

        content = data['content']

        # Ensure the lecture plans folder exists
        if not os.path.exists(lecture_plans_folder):
            os.makedirs(lecture_plans_folder)

        # Write the content to the file
        try:
            with open(file_path, "w", encoding='utf-8') as f:
                f.write(content)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return jsonify({
            "message": "Lecture plan updated successfully",
            "file_path": file_path
        }), 200

@app.route('/downloadlectureplan/<lecture_id>', methods=['GET'])
def download_lecture_plan_pdf(lecture_id):
    lecture_plans_folder = "lecture plans"
    md_file_path = os.path.join(lecture_plans_folder, f"{lecture_id}.md")

    if not os.path.exists(md_file_path):
        return jsonify({"error": "Lecture plan not found"}), 404

    # Read the Markdown content
    with open(md_file_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convert Markdown to HTML
    html_content = markdown(md_content)

    # Convert HTML to PDF
    # For Windows, specify the path to wkhtmltopdf.exe if needed
    # config = pdfkit.configuration(wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe')
    # pdf_output = pdfkit.from_string(html_content, False, configuration=config)

    pdf_output = pdfkit.from_string(html_content, False)

    # Send the PDF as response
    response = make_response(pdf_output)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', 'attachment', filename=f'lecture_plan_{lecture_id}.pdf')
    return response



# ------------------ GENERATE DYNAMIC LECTURE PLAN ------------------ #
@app.route('/generate-dynamic-lectureplan/<lecture_id>', methods=['POST'])
def generate_dynamic_lecture_plan(lecture_id):
    """
    Generate a dynamic lecture plan using incomplete topics and the Gemini API.
    Saves the lecture plan in Markdown format for further edits and retrieval.
    """
    # Default lecture duration
    lecture_duration = request.json.get("duration", 60)

    # Fetch all incomplete topics from the topics collection
    incomplete_topics = list(topics_col.find({"Status": "Incomplete"}))
    if not incomplete_topics:
        return jsonify({"error": "No incomplete topics available to generate the lecture plan"}), 400

    # Prepare the list of topic names for the prompt
    topic_names = [topic["name"] for topic in incomplete_topics]

    # Generate the lecture plan using Gemini
    prompt = (
        f"Create a lecture plan for the following topics, ensuring the total duration is approximately {lecture_duration} minutes:\n"
        f"{', '.join(topic_names)}.\n"
        "Format the output as:\n"
        "Objectives: Brief summary of lecture objectives.\n"
        "Activities: Describe planned activities.\n"
        "Assessments: Brief summary of assessments.\n"
        "Resources: Mention resources like slides and worksheets."
    )
    try:
        response = model.generate_content(prompt)
        lecture_plan_content = response.text
    except Exception as e:
        return jsonify({"error": f"Error generating lecture plan: {str(e)}"}), 500

    # Save the lecture plan to a Markdown file
    lecture_plans_folder = "lecture_plans"
    if not os.path.exists(lecture_plans_folder):
        os.makedirs(lecture_plans_folder)
    file_path = os.path.join(lecture_plans_folder, f"{lecture_id}.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(lecture_plan_content)

    # Return the generated lecture plan content and file path
    return jsonify({
        "message": "Dynamic lecture plan generated successfully",
        "lecture_id": lecture_id,
        "content": lecture_plan_content,
        "file_path": file_path
    }), 200


@app.route('/dynamic-lectureplan/<lecture_id>', methods=['GET', 'PUT'])
def manage_dynamic_lecture_plan(lecture_id):
    """
    Fetch or update the dynamic lecture plan content.
    - GET: Fetch the existing Markdown content.
    - PUT: Update the content in the Markdown file.
    """
    lecture_plans_folder = "lecture_plans"
    file_path = os.path.join(lecture_plans_folder, f"{lecture_id}.md")

    if request.method == 'GET':
        # Check if the file exists
        if not os.path.exists(file_path):
            return jsonify({"error": "Lecture plan not found"}), 404

        # Read the content of the file
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return jsonify({
                "lecture_id": lecture_id,
                "content": content
            }), 200
        except Exception as e:
            return jsonify({"error": f"Error reading lecture plan: {str(e)}"}), 500

    elif request.method == 'PUT':
        # Get the updated content from the request
        data = request.json
        if 'content' not in data:
            return jsonify({"error": "No content provided"}), 400

        updated_content = data['content']

        # Save the updated content to the Markdown file
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(updated_content)
            return jsonify({
                "message": "Lecture plan updated successfully",
                "file_path": file_path
            }), 200
        except Exception as e:
            return jsonify({"error": f"Error updating lecture plan: {str(e)}"}), 500


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)


