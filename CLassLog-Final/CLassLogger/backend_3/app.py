from flask import Flask
from routes.quiz_routes import quiz_route
from routes.notes_routes import notes_route
import socket
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.register_blueprint(quiz_route)
app.register_blueprint(notes_route)

if __name__ == '__main__':
    port = 8080
    app.run(host='0.0.0.0', port=port, debug=True)