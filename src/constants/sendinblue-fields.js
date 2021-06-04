const sibFields = {
  contacts: {
    listIds: 'listIds',
    unlinkListIds: 'unlinkListIds',
    emailBlacklisted: 'emailBlacklisted',
    smtpBlacklistSender: 'smtpBlacklistSender',
    attributes: {
      name: 'name', // remove?
      firstname: 'firstname',
      lastname: 'lastname',
      firmOrg: 'firm_org',
      expDate: 'expdate',
      gradDate: 'graddate',
      practice: 'practice',
      groups: 'groups',
    }
  }
}

const sibLists = {
  newsletter: {
    id: 2,
    title: 'Newsletter',
  },
  members: {
    id: 4,
    title: 'Members',
  },
  law_notes: {
    id: 5,
    title: 'Law Notes',
  },
  inactive: {
    id: 8,
    // title: '',
  },
}

const getAllListIndexes = () => {
  let lists = [];
  for (const key in sibLists) {
    lists.push(sibLists[key].id);
  }
  return lists;
}

const getMemberOnlyListIndexes = () => {
  let lists = [];
  for (const key in sibLists) {
    if (key !== 'newsletter') lists.push(sibLists[key].id);
  }
  return lists;
}

const getListTitle = (id) => {
  for (let key in sibLists) {
    if (id === sibLists[key].id) return sibLists[key].title;
  }
  return null;
}

module.exports = {
  sibFields,
  sibLists,
  getAllListIndexes,
  getMemberOnlyListIndexes,
  getListTitle,
};