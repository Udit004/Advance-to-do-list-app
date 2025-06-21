from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS so your React app can call this API

# Load the trained model
model = joblib.load("priority_model.pkl")

@app.route('/')
def home():
    return "Priority Prediction API is running"

# API to receive task and return predicted priority
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    task_text = data.get("text")

    if not task_text:
        return jsonify({"error": "No input text provided"}), 400

    # Predict using the model
    prediction = model.predict([task_text])[0]

    return jsonify({"priority": prediction})

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
