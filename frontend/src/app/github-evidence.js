export const initialEvidenceDraft = (project) => ({
  selectedSkills: [...(project.matching_skills || [])],
  contribution: '',
  wording: '',
  outcome: '',
  confirmed: false,
});


export const buildEvidenceApprovalPayload = (draft) => ({
  selected_skills: draft.selectedSkills,
  contribution: draft.contribution.trim(),
  wording: draft.wording.trim(),
  outcome: draft.outcome.trim(),
  confirmed: draft.confirmed,
});
