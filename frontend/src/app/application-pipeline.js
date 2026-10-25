export const APPLICATION_STATUSES = [
  'Saved',
  'Preparing',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
];

export const ALLOWED_NEXT_STATUSES = {
  Saved: ['Preparing', 'Applied', 'Withdrawn'],
  Preparing: ['Saved', 'Applied', 'Withdrawn'],
  Applied: ['Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
  Assessment: ['Interview', 'Offer', 'Rejected', 'Withdrawn'],
  Interview: ['Offer', 'Rejected', 'Withdrawn'],
  Offer: ['Applied', 'Interview', 'Withdrawn'],
  Rejected: ['Saved', 'Preparing', 'Applied'],
  Withdrawn: ['Saved', 'Preparing', 'Applied'],
};

export const groupApplicationsByStatus = (applications = []) => {
  const grouped = {
    Saved: [],
    Preparing: [],
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  };

  applications.forEach((app) => {
    if (grouped[app.status]) {
      grouped[app.status].push(app);
    } else {
      // If Assessment or Withdrawn, group into closest column
      if (app.status === 'Assessment') {
        grouped.Applied.push(app);
      } else if (app.status === 'Withdrawn') {
        grouped.Rejected.push(app);
      } else {
        grouped.Saved.push(app);
      }
    }
  });

  return grouped;
};

export const generateClientOutreachNote = ({
  jobTitle = 'Software Engineer',
  company = 'the company',
  keySkill = 'software engineering',
  recruiterName = '',
}) => {
  const name = recruiterName.trim() || 'there';
  let note = `Hi ${name}, applying for the ${jobTitle} role at ${company}. Experienced in ${keySkill} with verified project evidence. Would love to connect!`;

  if (note.length > 300) {
    note = `Hi ${name}, applying for ${jobTitle} at ${company}. Skilled in ${keySkill} with matching projects. Would love to connect!`;
  }
  if (note.length > 300) {
    note = `Hi ${name}, applying for ${jobTitle} at ${company}. Would love to connect and follow your engineering work!`;
  }
  if (note.length > 300) {
    note = note.slice(0, 297) + '...';
  }

  return note;
};
