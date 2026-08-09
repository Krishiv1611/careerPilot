# Career Track Suggestions — Design

## Decision

Connect the existing resume-category classifier to CareerPilot as an advisory onboarding feature. After a resume is uploaded, CareerPilot suggests up to three career tracks. The student must explicitly add a suggestion to their target roles before it influences discovery.

The classifier is not an eligibility gate, job-match score, or hiring probability. It never hides jobs, overwrites preferences, or changes an application.

## Chosen approach

Use synchronous inference during the existing resume upload flow. This is the smallest complete implementation because the model is local and inference is fast.

Alternatives rejected for this slice:

- A background worker adds polling and operational complexity without a demonstrated latency need.
- A separate “Run ML analysis” button makes students discover and trigger a second workflow after every upload.
- Automatic job searching from the top prediction gives an imperfect research model too much authority.

## Backend architecture

Create a focused `CareerTrackClassifier` service that:

- loads only the two repository-owned artifacts from `backend/analysis`;
- verifies each artifact against a checked-in SHA-256 checksum before unpickling;
- lazily loads the artifacts once;
- applies lightweight deterministic text cleanup without runtime corpus downloads;
- maps model class IDs to the notebook’s 25 category labels;
- returns the three highest probabilities at or above `0.10`;
- returns a structured unavailable result when artifacts, dependencies, checksums, or inference fail.

The Resume & Evidence Agent receives a new `suggest_career_tracks` task and calls the classifier as one of its tools. The resume upload router invokes the LangGraph supervisor after text extraction. Classifier failure must not fail resume upload.

## Data contract

Each resume stores:

```json
{
  "resume_category": "Java Developer",
  "career_track_suggestions": [
    {
      "category": "Java Developer",
      "confidence": 0.64,
      "rank": 1,
      "model_version": "resume-category-gbc-1.7.2"
    }
  ]
}
```

`resume_category` is the first suggestion for backwards compatibility. `career_track_suggestions` is an ordered JSON list and defaults to an empty list.

## Student experience

The Resume & Profile evidence pane shows a compact ranked track rail above extracted skills:

- Label: “Career tracks suggested from this resume”
- Explanation: “A starting point, not a decision. Add only the roles you actually want.”
- Each row shows rank, category, and “model signal” percentage.
- Primary action: “Use as target role”
- Confirmed state: “In target roles”

Selecting a suggestion updates the existing candidate profile while preserving locations, employment types, and existing target roles. Suggestions never become evidence and use blue rather than the green evidence treatment.

The UI reuses CareerPilot’s slate, blue, and emerald palette. Its signature element is a numbered vertical track rail, reflecting alternative career directions without adding another generic dashboard card.

## Failure and safety behavior

- Missing or invalid model artifacts produce no suggestions; upload continues.
- A checksum mismatch prevents unpickling.
- Empty resume text produces no suggestions.
- Unknown numeric model classes are ignored.
- Probabilities are rounded for transport but are never described as accuracy or hiring likelihood.
- Only the bundled artifacts are loadable; users cannot upload model files.
- The classifier remains advisory until the dataset is deduplicated and evaluated with grouped splits.

## Testing

- Unit-test probability sorting, category mapping, thresholds, and checksum rejection.
- Smoke-test the checked-in artifacts with the pinned scikit-learn version.
- Test LangGraph routing to the Resume & Evidence Agent with an injected predictor.
- Test the empty-database migration contains the suggestions column.
- Test target-role merging as a pure frontend behavior.
- Run backend tests, migration/startup contracts, navigation tests, lint, and production build.

## Non-goals

- Retraining the model in an API request.
- Automatic model downloads or NLTK corpus downloads.
- Background workers, model registries, experiment dashboards, or online learning.
- Using predicted categories to reject, rank, or silently search jobs.
