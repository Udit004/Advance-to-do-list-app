import os
from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS
import pickle
import numpy as np

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

# # Run the app
# if __name__ == '__main__':
#     app.run(debug=True)

# Add this block for Render to detect port
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)