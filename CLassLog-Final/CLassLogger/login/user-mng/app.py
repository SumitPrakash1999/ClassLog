from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, SignatureExpired

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)

# @app.before_first_request
# def create_tables():
#     db.create_all()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    phone_number = data['phone_number']
    new_user = User(username=username, password=password, phone_number=phone_number)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User registered successfully"), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(identity={'username': user.username})
        return jsonify(access_token=access_token), 200
    return jsonify(message="Invalid credentials"), 401

@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Invalidate the token here if needed
    return jsonify(message="Logged out successfully"), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route('/request_reset_password', methods=['POST'])
def request_reset_password():
    data = request.get_json()
    phone_number = data['phone_number']
    user = User.query.filter_by(phone_number=phone_number).first()
    if user:
        token = serializer.dumps(phone_number, salt='password-reset-salt')
        reset_url = f'http://localhost:3000/reset_password/{token}'
        # Here you should send the reset_url to the user's phone as an SMS
        print(f'Reset URL (send this via SMS): {reset_url}')
        return jsonify(message="Password reset link sent"), 200
    return jsonify(message="User with given phone number not found"), 404

@app.route('/reset_password/<token>', methods=['POST'])
def reset_password(token):
    try:
        phone_number = serializer.loads(token, salt='password-reset-salt', max_age=3600)
        data = request.get_json()
        new_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user = User.query.filter_by(phone_number=phone_number).first()
        if user:
            user.password = new_password
            db.session.commit()
            return jsonify(message="Password has been reset successfully"), 200
        return jsonify(message="User with given phone number not found"), 404
    except SignatureExpired:
        return jsonify(message="The token has expired"), 400


@app.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    current_user = get_jwt_identity()
    if current_user:
        return jsonify({"username": current_user['username']}), 200
    return jsonify({"message": "No user logged in"}), 403


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
