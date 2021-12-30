const sibFields = {
  contacts: {
    attributes: {
      firstname: 'firstname',
      lastname: 'lastname',
      firmOrg: 'firm_org',
      practice: 'practice',
      groups: 'groups',
      expDate: 'expdate',
      gradDate: 'graddate',
      lnExpDate: 'lnexpdate',
    },
    // listIds: 'listIds',
    // unlinkListIds: 'unlinkListIds',
    // emailBlacklisted: 'emailBlacklisted',
    // smtpBlacklistSender: 'smtpBlacklistSender',
  }
}

const sibLists = {
  newsletter: {
    id: 2,
  },
  members: {
    id: 4,
  },
  law_notes: {
    id: 5,
  },
}

module.exports = {
  sibFields,
  sibLists,
};