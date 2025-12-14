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
            
            # Map prediction ID back to category name
            category_mapping = {
                15: "Java Developer",
                23: "Testing",
                8: "DevOps Engineer",
                20: "Python Developer",
                24: "Web Designing",
                12: "HR",
                13: "Hadoop",
                3: "Blockchain",
                10: "ETL Developer",
                18: "Operations Manager",
                6: "Data Science",
                22: "Sales",
                16: "Mechanical Engineer",
                1: "Arts",
                7: "Database",
                11: "Electrical Engineering",
                14: "Health and fitness",
                19: "PMO",
                4: "Business Analyst",
                9: "DotNet Developer",
                2: "Automation Testing",
                17: "Network Security Engineer",
                21: "SAP Developer",
                5: "Civil Engineer",
                0: "Advocate",
            }
            
            # Since model prediction is int
            predicted_label = category_mapping.get(int(prediction_id), str(prediction_id))
            return predicted_label
        except Exception as e:
            print(f"Error during prediction: {e}")
            return "Unknown"
