const sibUtils = require('./libs/sendinblue');
const constants = require('./constants');
const moment = require('moment');

const sibContactsApi = sibUtils.sibContactsApi;
// constants
const sibFields = constants.sibFields;
const sibLists = constants.sibLists;

// airtable
const airtableUtils = require("./libs/Airtable");
// const getMinifiedRecord = airtableUtils.getMinifiedRecord;
const getGroups = airtableUtils.getGroups;
// constants
const dbFields = constants.dbFields;

const updateContacts = async () => {
  console.log('Hello contacts!');
  console.log('at env var', process.env.AIRTABLE_API_KEY);

  try {
    const groups = await getGroups();
    console.log('GROUPS', groups);
  } catch (error) {
    console.log('ERROR', error);
  }

  let contactsApi = new sibContactsApi();
}

updateContacts();