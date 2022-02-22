# lgbtbarny-cronjobs

The `update-contacts` script is a script to update SendinBlue contacts from Airtable data, with the folloiwng caveats:

* It is more of a _migration_ script, that updates all data, not just a _cronjob_ that would trigger date-driven updates, such as when users memberships and subscriptions expire.
* It is not just an _updater_. If an email exists in Airtable but is not in SendinBlue, it will create the contact in SendinBlue.

## `Update-Contacts` Script Steps

1) Find all emails on the `emails` Airtable table.

2) Find associated users from `members` table.

3) Create a SendinBlue contact field object with the following fields from Airtable (SendinBlue attributes in parenthesis) - only for verified emails:

   - first name (`FIRSTNAME`)
   - last name (`LASTNAME`)
   - firm or org (`FIRM_ORG`)
   - practice setting (`PRACTICE`)
   - groups of interest (`GROUPS`)
   - attorney member expiration date (`EXPDATE`)
   - student member graduation date (`GRADDATE`)
   - Law Notes subscription expiration date (`LNEXPDATE`)

4) Add/remove SendinBlue contact to mailing lists. NOTE: SendinBlue is the source of truth for the `Newsletter` and as such does not need to be updated by this script:

   1) If user is an active attorney or student member, add to the `Members` and `Law Notes` mailing lists, unless they have chosen not to receive them.
   2) If user is a currently Law Notes subscriber, add them to the `Law Notes` mailing list, if they have not excluded themselve from receiving.

5) Remove attorney and subscription expired and student graduated contacts from the `Members` and `Law Notes` mailing lists. Remove those lists if user has chosen not to get them.

6) Try to update the contact in SendinBlue.

7) If find out that contact does not exist (by getting a `404 error`)

   - Use the contact field object from above, to create the contact.
   - Add newsletter to the field object.
   - And create contact.

## Running Script Locally

> `AIRTABLE_API_KEY={key} AIRTABLE_MEMBERS_BASE_ID={base_id} SIB_API_KEY={key} node src/update-contacts.js`

## Deployment

Deployed as GitHub action [https://github.com/baltazarv/lgbtbarny-cronjobs/actions](https://github.com/baltazarv/lgbtbarny-cronjobs/actions).

Using CLI for compiling a Node.js module into a single file, ncc [https://github.com/vercel/ncc](https://github.com/vercel/ncc) in _package.json_.

## More Scripts

More scripts could be found in clinic repo [https://github.com/baltazarv/lgbtbarny-members/tree/master/batch-scripts/email](https://github.com/baltazarv/lgbtbarny-members/tree/master/batch-scripts/email).