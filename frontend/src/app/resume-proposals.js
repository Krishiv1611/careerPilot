const REVIEWED_STATUSES = new Set(['accepted', 'rejected']);


export const buildReviewPayload = (changes, decisions) => ({
  decisions: changes.map((change) => ({
    change_id: change.id,
    status: decisions[change.id] || 'pending',
  })),
});


export const reviewProgress = (changes, decisions) => {
  const reviewed = changes.filter((change) => REVIEWED_STATUSES.has(decisions[change.id])).length;

  return {
    reviewed,
    total: changes.length,
    complete: reviewed === changes.length,
  };
};
