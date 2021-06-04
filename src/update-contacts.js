const moment = require('moment');

const sibUtils = require('./libs/sendinblue');
const sibContactsApi = sibUtils.sibContactsApi;
const sibUpdateContact = sibUtils.sibUpdateContact;
const sibCreateContact = sibUtils.sibCreateContact;
// constants
const sendinBlueFields = require('./constants/sendinblue-fields');
const sibFields = sendinBlueFields.sibFields;
const sibLists = sendinBlueFields.sibLists;

// airtable
const airtableUtils = require("./libs/Airtable");
const emailsTable = airtableUtils.emailsTable;
const membersTable = airtableUtils.membersTable;
const getMinifiedRecord = airtableUtils.getMinifiedRecord;
const getGroups = airtableUtils.getGroups;
// constants
const dbFields = require('./constants/sendinblue-fields').dbFields;

const updateContacts = async () => {
  const timeDateStarted = moment();
  let totalRecords = 0;
  let countUpdatedRecs = 0;
  let countCreatedRecs = 0;

  try {
    const groups = await getGroups();
    console.log('GROUPS', groups);
  } catch (error) {
    console.log('Get groups error:', error);
  }


  // go thru every email
  emailsTable.select({
    maxRecords: 300,
    // filterByFormula: `SEARCH(RECORD_ID(), "recMvnDMiY3a4dfBi")`,
    // filterByFormula: `SEARCH(RECORD_ID(), "recOcgZwaaKnkan8x,recvSCl4IpLMw3rOr")`,
  })
    .eachPage(
      async function page(emailRecs, fetchNextPage) {
        for (let i = 0; i < emailRecs.length; i++) {
          const emailRecord = getMinifiedRecord(emailRecs[i]);
          const email = emailRecord.fields.address;

          totalRecords++;

          // find user in members table
          const userRecs = await membersTable.select({
            filterByFormula: `SEARCH("${email}", ARRAYJOIN(${dbFields.members.emails}))`,
          }).firstPage();

          console.log('userRecs', userRecs);

          let contactFields = null;

          // there should only be one user, but if more will only get first record
          if (userRecs && userRecs.length > 0) {
            const user = getMinifiedRecord(userRecs[0]);
            contactFields = {};
            contactFields.attributes = contactFields.attributes || {};

            // add first and last name to email update/create object
            if (user.fields[dbFields.members.firstName]) {
              contactFields.attributes[sibFields.contacts.attributes.firstname] = user.fields[dbFields.members.firstName];
            }
            if (user.fields[dbFields.members.lastName]) {
              contactFields.attributes[sibFields.contacts.attributes.lastname] = user.fields[dbFields.members.lastName];
            }
            // add firm/org
            if (user.fields[dbFields.members.employer]) {
              contactFields.attributes[sibFields.contacts.attributes.firmOrg] = user.fields[dbFields.members.employer];
            }
            // add practice setting
            if (user.fields[dbFields.members.practiceSetting]) {
              contactFields.attributes[sibFields.contacts.attributes.practice] = user.fields[dbFields.members.practiceSetting];
            }
            // add group interests
            if (user.fields[dbFields.members.interestGroups]) {
              const groupIds = user.fields[dbFields.members.interestGroups];
              const userGroups = groupIds.map((id) => {
                const groupFound = groups.find((group) => group.id === id);
                return groupFound.fields.name;
              })
              contactFields.attributes[sibFields.contacts.attributes.groups] = userGroups.join(', ');
            }

            // using Airtable _status field (calculate using payments instead?)
            const status = user.fields[dbFields.members.status];

            // add membership expires date
            // get exp date from Airtable (calculate date instead?)
            const expDate = user.fields[dbFields.members.expDate];
            if (expDate) {
              const expDateFormatted = moment(expDate).format('YYYY-MM-DD');
              contactFields.attributes[sibFields.contacts.attributes.expDate] = expDateFormatted;
            } else {
              contactFields.attributes[sibFields.contacts.attributes.expDate] = '';
            }

            // add graduation date for students
            // get grad date from Airtable (calculate date instead?)
            const gradDate = user.fields[dbFields.members.gradDate];
            if (gradDate) {
              const gradDateFormatted = moment(gradDate).format('YYYY-MM-DD');
              contactFields.attributes = contactFields.attributes || {};
              contactFields.attributes[sibFields.contacts.attributes.gradDate] = gradDateFormatted;
            } else {
              contactFields.attributes[sibFields.contacts.attributes.gradDate] = '';
            }

            // if user is active, add to members-only lists
            if (status === 'attorney' || status === 'student') {
              contactFields.listIds = contactFields.listIds || [];
              contactFields.listIds.push(sibLists.members.id);
              contactFields.listIds.push(sibLists.law_notes.id);
            }

            if (status === 'subscribed') {
              contactFields.listIds = contactFields.listIds || [];
              contactFields.listIds.push(sibLists.law_notes.id);
            }

            console.log('contactFields', contactFields);

          } else {
            console.log(`No member record for ${email}`);
          }

          // find Sendinblue contact
          let contactsApi = new sibContactsApi();
          try {
            const contact = await contactsApi.getContactInfo(email);
            // console.log('update contact', contact)

            // if found & if something to update
            if (contactFields) {
              try {
                // not checking that email is verified before updating
                contactsApi = new sibContactsApi();
                const updateContact = getSibObject('update', contactFields);

                // UPDATE CONTACT
                // await contactsApi.updateContact(email, updateContact); // nothing returned
                countUpdatedRecs++;
                console.log('Updated #', countCreatedRecs, email, contactFields);
              } catch (err) {
                console.log('updateContact error', err);
              }
            }
          } catch (err) {
            // if contact not found, 404 error, create contact
            // create contact if it doesn't exist
            if (err.status === 404) {
              // console.log('create contact', email, 'err', err.status);

              try {
                contactFields = contactFields || {};
                contactFields.listIds = contactFields.listIds || [];
                // add to newsletter if new contact
                // TODO: reasses if should add to newsletter
                contactFields.listIds.push(sibLists.newsletter.id);

                contactFields.email = email;
                const createContact = getSibObject('create', contactFields);

                // CREATE CONTACT
                // await contactsApi.createContact(createContact);
                countCreatedRecs++;
                console.log('Created #', countCreatedRecs, email, contactFields);
              } catch (err) {
                console.log('createContact error', err);
              }
            }
          }
        }

        // setTimeout(fetchNextPage, 1000);
        fetchNextPage();
      },
      function done(err) {
        if (err) console.log('Airtable error', err);
        console.log('Total records:', totalRecords);
        console.log('Updated records:', countUpdatedRecs);
        console.log('Created records:', countCreatedRecs);
        console.log('Started:', timeDateStarted, '; ended', moment());
      }
    )
}

const getSibObject = (type, contactFields) => {
  let sibObject = null;
  if (type === 'update') {
    sibObject = new sibUpdateContact();
  } else if (type === 'create') {
    sibObject = new sibCreateContact();
    // always need to pass email to create contact
    sibObject.email = contactFields.email;
  }
  if (contactFields.listIds) sibObject.listIds = contactFields.listIds;
  if (contactFields.attributes) sibObject.attributes = contactFields.attributes;
  return sibObject;
}

updateContacts();