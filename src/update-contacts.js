// TODO: write updated, created, and all contacts to logs file?

// // TODO: use .env for development (vs passing vars in front of terminal command)?
// require('dotenv').config({ path: __dirname + "../.env.development" });

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
const dbFields = require('./constants/airtable-fields').dbFields;

const updateContacts = async () => {
  const timeDateStarted = moment();
  let totalEmails = 0;
  let totalVerified = 0;
  let countUpdatedRecs = 0;
  let countCreatedRecs = 0;

  const groups = await getGroups();

  // go thru every email
  emailsTable.select({
    // // test options:
    // maxRecords: 100,
    // filterByFormula: `SEARCH(RECORD_ID(), "rec2sTp9rVwhbfaQY")`,
    // view: '_test',
    // filterByFormula: `SEARCH(RECORD_ID(), "recoyVuyBpuXS1J37,recfow3fQXVTGTefI, rec2sTp9rVwhbfaQY")`,
  })
    .eachPage(
      async function page(emailRecs, fetchNextPage) {
        for (let i = 0; i < emailRecs.length; i++) {
          const emailRecord = getMinifiedRecord(emailRecs[i]);
          const email = emailRecord.fields[dbFields.emails.address];
          const verified = emailRecord.fields[dbFields.emails.verified];
          totalEmails++;

          if (verified) {
            totalVerified++

            // find user in members table
            const userRecs = await membersTable.select({
              filterByFormula: `SEARCH("${email}", ARRAYJOIN(${dbFields.members.emails}))`,
            }).firstPage();

            let contactFields = null;
            // find Sendinblue contact
            let contactsApi = new sibContactsApi();

            // there should only be one user, but if more will only get first record
            if (userRecs && userRecs.length > 0) {
              const user = getMinifiedRecord(userRecs[0]);
              // console.log('user', user)
              contactFields = {};
              contactFields.attributes = {};

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
              } else {
                // if user removed
                contactFields.attributes[sibFields.contacts.attributes.firmOrg] = '';
              }

              // add practice setting
              if (user.fields[dbFields.members.practiceSetting]) {
                contactFields.attributes[sibFields.contacts.attributes.practice] = user.fields[dbFields.members.practiceSetting];
              } else {
                // if user removed
                contactFields.attributes[sibFields.contacts.attributes.practice] = '';
              }

              // add group interests
              if (user.fields[dbFields.members.interestGroups]) {
                const groupIds = user.fields[dbFields.members.interestGroups];
                const userGroups = groupIds.map((id) => {
                  const groupFound = groups.find((group) => group.id === id);
                  return groupFound.fields.name;
                })
                contactFields.attributes[sibFields.contacts.attributes.groups] = userGroups.join(', ');
              } else {
                // if user removed
                contactFields.attributes[sibFields.contacts.attributes.groups] = '';
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
                contactFields.attributes[sibFields.contacts.attributes.gradDate] = gradDateFormatted;
              } else {
                contactFields.attributes[sibFields.contacts.attributes.gradDate] = '';
              }

              // add Law Notes subscription expiration date
              const lnExpDate = user.fields[dbFields.members.lnExpDate];
              if (lnExpDate) {
                const lnExpDateFormatted = moment(lnExpDate).format('YYYY-MM-DD');
                contactFields.attributes[sibFields.contacts.attributes.lnExpDate] = lnExpDateFormatted;
              } else {
                contactFields.attributes[sibFields.contacts.attributes.lnExpDate] = '';
              }

              // mailing lists
              // ... not changing Newsletter subscription since SendinBlue is source of truth

              // add to mailing lists (listIds)
              contactFields.listIds = []
              contactFields.unlinkListIds = []

              // if user is active and member has not unsubscribed from those mailings, add to members-only lists
              if (
                status === 'attorney' ||
                status === 'student' ||
                status === 'subscribed'
              ) {
                // Members mailing list
                if (status === 'subscribed') {
                  // if subscriber previously a member
                  contactFields.unlinkListIds = [sibLists.members.id];
                } else {
                  if (user.fields?.[dbFields.members.listsUnsubscribed]?.find((list) => list === dbFields.members.listMembers)) {
                    // if user removed themselves from Members mailing
                    contactFields.unlinkListIds.push(sibLists.members.id);
                  } else {
                    contactFields.listIds.push(sibLists.members.id);
                  }
                }

                // Law Notes mailing list
                if (user.fields?.[dbFields.members.listsUnsubscribed]?.find((list) => list === dbFields.members.listLawNotes)) {
                  // if user removed themselves from Law Notes mailing
                  contactFields.unlinkListIds.push(sibLists.law_notes.id);
                } else {
                  contactFields.listIds.push(sibLists.law_notes.id);
                }
              }

              if (
                status === 'expired' ||
                status === 'graduated' ||
                status === 'not subscribed'
              ) {
                contactFields.unlinkListIds = [
                  sibLists.members.id,
                  sibLists.law_notes.id
                ]
              }

              // if no items added
              if (contactFields.listIds.length === 0) {
                delete contactFields.listIds
              }
              if (contactFields.unlinkListIds.length === 0) {
                delete contactFields.unlinkListIds
              }

            } else {
              console.log(`No member record for ${email}`);
            }

            // if something to update
            if (contactFields) {
              try {
                // not checking that email is verified before updating
                contactsApi = new sibContactsApi();
                const updateContact = getSibObject('update', contactFields);

                // console.log('updateContact', {
                //   contactFields,
                //   updateContact,
                // })

                // UPDATE CONTACT
                await contactsApi.updateContact(email, updateContact); // nothing returned
                countUpdatedRecs++;
                // console.log('Updated #', countUpdatedRecs, email);
              } catch (err) {
                // if contact not found, 404 error, create contact
                if (err.status === 404) {

                  try {
                    contactFields = contactFields || {};
                    contactFields.listIds = contactFields.listIds || [];
                    // add to newsletter if new contact
                    contactFields.listIds.push(sibLists.newsletter.id);

                    contactFields.email = email;
                    const createContact = getSibObject('create', contactFields);

                    // CREATE CONTACT
                    await contactsApi.createContact(createContact);
                    countCreatedRecs++;
                    console.log('Created #', countCreatedRecs, email); // , contactFields
                  } catch (err) {
                    console.log('createContact', {
                      error: err?.response?.body,
                      status: err.status,
                    });
                  }
                }
              }
            }
          }
        }

        fetchNextPage();
      },
      done = (err) => {
        if (err) console.log('Airtable error', err);
        console.log('Total emails:', totalEmails);
        console.log('Total verified:', totalVerified);
        console.log('Updated:', countUpdatedRecs);
        console.log('Created:', countCreatedRecs);
        // time stats
        const timeFormat = 'MMMM Do YYYY, h:mm:ss a';
        console.log('Start:', timeDateStarted.format(timeFormat), ': End', moment().format(timeFormat), ': Diff', moment().diff(timeDateStarted, 'minutes'), 'minutes');
      }
    )
}

const getSibObject = (type, contactFields) => {
  let sibObject = null;
  if (type === 'update') {
    sibObject = new sibUpdateContact();

    // unlink list only if updating contact
    if (contactFields.unlinkListIds) sibObject.unlinkListIds = contactFields.unlinkListIds;

  } else if (type === 'create') {
    sibObject = new sibCreateContact();
    // always need to pass email to create contact
    sibObject.email = contactFields.email;
  }

  // all fields that need to be updated must be added to contactFields
  if (contactFields.listIds) sibObject.listIds = contactFields.listIds;
  if (contactFields.attributes) sibObject.attributes = contactFields.attributes;
  return sibObject;
}

updateContacts();