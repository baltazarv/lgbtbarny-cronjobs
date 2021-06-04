const Airtable = require("airtable");
let membersBase = null;

let membersTable = null;
let emailsTable = null;
let groupsTable = null;

if (process.env.AIRTABLE_API_KEY) {
  membersBase = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_MEMBERS_BASE_ID
  );

  membersTable = membersBase("members");
  emailsTable = membersBase("emails");
  groupsTable = membersBase("groups");
}

const getMinifiedRecord = (record) => {
  return {
    id: record.id,
    fields: record.fields,
  };
};

const minifyRecords = (records) => {
  return records.map((record) => getMinifiedRecord(record));
};

const getRecords = (table, selectOptions) => {
  selectOptions = selectOptions || {};
  return new Promise((resolve, reject) => {
    const allCases = [];

    table
      .select(selectOptions)
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach((record) => {
            allCases.push(getMinifiedRecord(record));
          });
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
          } else {
            resolve(allCases);
          }
        }
      );
  });
};

const getGroups = (selectOptions) => {
  if (groupsTable) {
    return getRecords(groupsTable, selectOptions);
  }
  console.log('error')
  return;
}

exports.membersTable = membersTable;
exports.emailsTable = emailsTable;
exports.groupsTable = groupsTable;

exports.getGroups = getGroups;
exports.getMinifiedRecord = getMinifiedRecord;
exports.minifyRecords = minifyRecords;
