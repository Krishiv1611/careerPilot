export const mergeTargetRole = (profile, category) => {
  const targetRoles = profile.target_roles || [];
  const alreadyIncluded = targetRoles.some(
    (role) => role.toLowerCase() === category.toLowerCase(),
  );

  return {
    target_roles: alreadyIncluded ? [...targetRoles] : [...targetRoles, category],
    preferred_locations: [...(profile.preferred_locations || [])],
    employment_types: [...(profile.employment_types || [])],
  };
};
