import os
from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)  # Enable CORS so your React app can call this API

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), "priority_model.pkl")
model = joblib.load(model_path)

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

# Add this block for Render to detect port
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
