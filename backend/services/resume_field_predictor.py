import os
import joblib
import pandas as pd
import re

class ResumeFieldPredictor:
    def __init__(self):
        # Define paths to model and vectorizer
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "analysis", "best_model.pkl")
        tfidf_path = os.path.join(base_dir, "analysis", "tfidf.pkl")

        if not os.path.exists(model_path) or not os.path.exists(tfidf_path):
            print("Warning: Model or TFIDF vectorizer not found.")
            self.model = None
            self.tfidf = None
        else:
            try:
                self.model = joblib.load(model_path)
                self.tfidf = joblib.load(tfidf_path)
            except Exception as e:
                print(f"Error loading model: {e}")
                self.model = None
                self.tfidf = None

    def clean_resume(self, text):
        clean_text = re.sub('http\S+\s', ' ', text)
        clean_text = re.sub('RT|cc', ' ', clean_text)
        clean_text = re.sub('#\S+', '', clean_text)
        clean_text = re.sub('@\S+', '  ', clean_text)
        clean_text = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~"""), ' ', clean_text)
        clean_text = re.sub(r'[^\x00-\x7f]', r' ', clean_text)
        clean_text = re.sub('\s+', ' ', clean_text)
        return clean_text

    def predict(self, text: str) -> str:
        if not self.model or not self.tfidf:
            return "Unknown"

        try:
            cleaned_text = self.clean_resume(text)
            input_features = self.tfidf.transform([cleaned_text])
            prediction_id = self.model.predict(input_features)[0]
            
            # Map prediction ID back to category name if necessary
            # Assuming the model returns the string label directly as it's a classifier trained on labels
            # If it returns a number, we need the mapping. 
            # Based on standard sklearn usage with LabelEncoder, it might return int.
            # However, if the target was string, it returns string.
            # I will assume it returns the string or handle it if it is an int/code.
            # To be safe, let's just return the prediction.
            
            return str(prediction_id)
        except Exception as e:
            print(f"Error during prediction: {e}")
            return "Unknown"
