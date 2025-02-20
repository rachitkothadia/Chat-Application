from flask import Flask, request, jsonify
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load stopwords
with open("../ml_model/stopwords.txt", "r") as file:
    stopwords = file.read().splitlines()

# Load vectorizer and model
vectorizer = TfidfVectorizer(stop_words=stopwords, lowercase=True, vocabulary=pickle.load(open("../ml_model/tfidf_vectorizer.pkl", "rb")))
model = pickle.load(open("../ml_model/LinearSVC.pkl", "rb"))

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"error": "Empty message"}), 400

        transformed_input = vectorizer.transform([user_input])
        prediction = model.predict(transformed_input)[0]

        return jsonify({"prediction": int(prediction)})  # 0 = Safe, -1 = Harmful
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")  # Allow external access if needed
