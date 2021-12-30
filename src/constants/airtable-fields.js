// Airtable bases with table fields
// ... only fields used on script!
exports.dbFields = {
  // members base: members table
  members: {
    emails: 'emails',
    firstName: 'first_name',
    lastName: 'last_name',
    employer: 'employer',
    practiceSetting: 'practice_setting',
    interestGroups: 'interest_groups',
    listsUnsubscribed: 'lists_unsubscribed',
    // TODO: change values to match SendinBlue
    listMembers: 'members',
    listLawNotes: 'law_notes',

    // calc
    status: "_status",
    expDate: "_exp_date",
    gradDate: "_grad_date",
    lnExpDate: "_ln_exp_date",
  },

  // members base: emails table
  emails: {
    address: 'address',
  },
};
