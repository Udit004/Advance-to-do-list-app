import os, joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(__file__), "priority_model.pkl")

try:
    model = joblib.load(model_path)
    print("[✅] Model loaded successfully:", model)
except Exception as e:
    print("[❌] Could not load model:", e)
    raise

@app.route("/", methods=["GET"])
def home():
    return "Priority Prediction API is running", 200

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    print("[➡️] /predict payload:", data)

    task_text = data.get("text")
    if not task_text:
        return jsonify({"error": "No input text provided"}), 400

    try:
        prediction = model.predict([task_text])[0]
        print("[✅] Predicted:", prediction)
        return jsonify({"priority": prediction}), 200
    except Exception as e:
        print("[❌] Prediction error:", e)
        return jsonify({"error": "Prediction failed"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
