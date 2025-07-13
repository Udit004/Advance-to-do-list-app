import os, joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": ["https://advance-to-do-list-app.vercel.app", "http://localhost:5173"]}}, supports_credentials=True)

# Load model and SentenceTransformer
model_path = os.path.join(os.path.dirname(__file__), "priority_model_advanced.pkl")
encoder_path = os.path.join(os.path.dirname(__file__), "label_encoder.pkl")

try:
    clf = joblib.load(model_path)
    le = joblib.load(encoder_path)
    embedder = SentenceTransformer("all-MiniLM-L6-v2")  # ✅ loads from Hugging Face
    print("[✅] ML model, label encoder, and embedder loaded.")
except Exception as e:
    print("[❌] Error loading model or components:", e)
    raise

@app.route("/", methods=["GET"])
def home():
    return "Priority Prediction API is running", 200

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    print("[➡️] /predict payload:", data)

    task = data.get("task", "")
    description = data.get("description", "")
    due_date_str = data.get("due_date", "")

    if not task or not due_date_str:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        full_text = task + ". " + description
        embedding = embedder.encode([full_text])

        due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        days_left = (due_date - datetime.now()).days
        days_left = np.array([[days_left]])

        X = np.hstack([embedding, days_left])
        prediction = clf.predict(X)[0]
        priority_label = le.inverse_transform([prediction])[0]

        print("[✅] Predicted:", priority_label)
        return jsonify({"priority": priority_label}), 200
    except Exception as e:
        print("[❌] Prediction error:", e)
        return jsonify({"error": "Prediction failed"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
