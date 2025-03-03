from flask import Flask, request, jsonify
import joblib
import os
import numpy as np
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load ML Model and Vectorizer
MODEL_PATH = os.path.join(os.path.dirname(__file__), "LogisticRegression.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "tfidf_vectorizer.pkl")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

# Preprocessing function
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'\W+', ' ', text)
    return text

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    # Preprocess and transform input text
    processed_message = preprocess_text(message)
    message_vector = vectorizer.transform([processed_message])
    
    # Predict
    prediction = model.predict(message_vector)[0]  # -1 for harmful, 0 for safe

    return jsonify({"prediction": int(prediction)})  # Convert NumPy int to Python int

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
