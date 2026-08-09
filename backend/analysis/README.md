# Resume category model research

This folder contains the original resume-category experiment and its generated artifacts:

- `Resume_analyser.ipynb`
- `ResumeDataSet.csv`
- `tfidf.pkl`
- `best_model.pkl`

The notebook trains a TF-IDF vectorizer and a gradient-boosting classifier for 25 broad resume categories. The checked-in pickle artifacts were generated with scikit-learn 1.7.2.

## Current evaluation status

The notebook reports 99.48% accuracy from a random row-level split. That number is not a reliable production estimate:

- The dataset contains 962 rows but only 166 unique resume texts.
- 796 rows duplicate another resume, with some texts repeated up to 18 times.
- A random split can place the same resume text in both training and test sets.
- The label encoder is not saved with the model; the prediction example relies on a separate hard-coded category mapping.
- Pickle files can execute code when loaded and must never be accepted from an untrusted source.

CareerPilot now uses the checked-in artifacts as a bounded advisory feature during resume upload. The files are loaded only after their SHA-256 checksums match the trusted values in `career_track_classifier.py`. A prediction is shown as an editable career-track suggestion and is never used as an eligibility rule, automatic profile label, or job-search restriction. Artifact failure does not block resume upload.

## Run the notebook

From the repository root:

```powershell
python -m venv .venv-analysis
.\.venv-analysis\Scripts\Activate.ps1
pip install -r backend\analysis\requirements.txt
jupyter lab backend\analysis\Resume_analyser.ipynb
```

The same dependencies are available through `pip install -e ".[analysis]"`.

## Remaining model-quality work

Before treating the classifier confidence as a meaningful quality metric:

1. Deduplicate or group identical resumes before train/test splitting.
2. Use a grouped and stratified evaluation with per-category metrics.
3. Save the category encoder with the trained pipeline.
4. Record dataset source, license, model version, and training metrics.
5. Export to a safer, versioned format or load only a trusted, checksum-verified artifact.
6. Present the result as an editable target-role suggestion, never as an automatic decision or job-search restriction.
