import os
import requests
import logging
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from pymongo import MongoClient
import datetime

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['nutri_decode']
logs_collection = db['food_logs']

# Nutritionix API credentials
NUTRITIONIX_APP_ID = 'c6614be4'
NUTRITIONIX_API_KEY = '9bf955c494bcac13670e12f052411bbc'

# Nutritionix analysis function
def analyze_food(food_name):
    try:
        url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
        headers = {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_API_KEY,
            "Content-Type": "application/json"
        }
        data = {"query": food_name}
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result_data = response.json()
        if result_data and "foods" in result_data and len(result_data["foods"]) > 0:
            food = result_data["foods"][0]
            result = {
                "food": food.get("food_name", "Unknown"),
                "calories": food.get("nf_calories", 0),
                "protein": food.get("nf_protein", 0),
                "carbs": food.get("nf_total_carbohydrate", 0),
                "fats": food.get("nf_total_fat", 0)
            }
            return result
        return {"food": "Unknown", "calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    except Exception as e:
        logger.error(f"Error in analyze_food: {str(e)}")
        return {"error": f"Failed to analyze food: {str(e)}"}

@app.route('/')
def home():
    return jsonify({"message": "Nutri Decode Backend running! Use /upload for POST requests."})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'food_name' not in data:
        return jsonify({"error": "No food name provided"}), 400

    food_name = data['food_name']
    result = analyze_food(food_name)
    return jsonify(result)

@app.route('/save-log', methods=['POST'])
def save_log():
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ['food', 'calories', 'protein', 'carbs', 'fats']):
            return jsonify({"error": "Invalid data format"}), 400

        log_entry = {
            'food': data['food'],
            'calories': data['calories'],
            'protein': data['protein'],
            'carbs': data['carbs'],
            'fats': data['fats'],
            'timestamp': datetime.datetime.utcnow()
        }
        logs_collection.insert_one(log_entry)
        return jsonify({"message": "Log saved successfully"}), 201
    except Exception as e:
        logger.error(f"Error in save_log: {str(e)}")
        return jsonify({"error": f"Failed to save log: {str(e)}"}), 500

# Ensure uploads folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    # Placeholder: you can add real image recognition here later
    return jsonify({"error": "Image analysis not implemented"}), 501

if __name__ == '__main__':
    from waitress import serve
    serve(app, host='127.0.0.1', port=5000)
