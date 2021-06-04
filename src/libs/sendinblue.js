// Sendin Blue
const SibApiV3Sdk = require('sib-api-v3-sdk');
let defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SIB_API_KEY;

// apiInstance
const sibContactsApi = SibApiV3Sdk.ContactsApi;
// create contact
const sibCreateContact = SibApiV3Sdk.CreateContact;
// update contact
const sibUpdateContact = SibApiV3Sdk.UpdateContact;

// API must create a new instance of the following
// get-contact-info, update-contact
exports.sibContactsApi = sibContactsApi;
// create contact
exports.sibCreateContact = sibCreateContact;
// update contact
exports.sibUpdateContact = sibUpdateContact;
