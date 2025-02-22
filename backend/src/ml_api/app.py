from flask import Flask, request, jsonify
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load stopwords
with open("stopwords.txt", "r") as file:
    stopwords = file.read().splitlines()

# Load vectorizer
try:
    with open("tfidf_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)

    if not isinstance(vectorizer, TfidfVectorizer):
        raise ValueError("Invalid vectorizer file. Re-train and save the correct vectorizer.")

except Exception as e:
    raise RuntimeError(f"Error loading TF-IDF vectorizer: {str(e)}")

# Load the trained model
try:
    with open("LinearSVC.pkl", "rb") as f:
        model = pickle.load(f)

    # Ensure the model is a trained LinearSVC model
    if not hasattr(model, "predict"):
        raise ValueError("Invalid model file. Re-train and save the correct LinearSVC model.")

except Exception as e:
    raise RuntimeError(f"Error loading ML model: {str(e)}")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"error": "Empty message"}), 400

        # Ensure vectorizer and model work together
        try:
            transformed_input = vectorizer.transform([user_input])
        except Exception as e:
            return jsonify({"error": f"Vectorization failed: {str(e)}"}), 500

        try:
            prediction = model.predict(transformed_input)[0]
        except Exception as e:
            return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500

        return jsonify({"prediction": int(prediction)})  # 0 = Safe, -1 = Harmful
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")  # Allow external access
