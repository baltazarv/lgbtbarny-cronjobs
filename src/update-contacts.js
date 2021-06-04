const sibUtils = require('../libs/sendinblue');
const constants = require('./constants');
const moment = require('moment');

const sibContactsApi = sibUtils.sibContactsApi;
// constants
const sibFields = constants.sibFields;
const sibLists = constants.sibLists;
// airtable constants
const dbFields = constants.dbFields;

const updateContacts = async () => {
  console.log('Hello contacts!');
  console.log('env var', process.env.TEST);
  console.log('logging env vars above?');

  let contactsApi = new sibContactsApi();
}

updateContacts();