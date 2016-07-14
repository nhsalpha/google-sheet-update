API to Google sheet
===================

Updates a google sheet with results from an API

## Update script

To run the update script:

```
npm run update
```

### Environment variables

| Key          | Description |
|--------------|-------------|
| CLIENT_EMAIL | The email address associated with the Google Service Account. See [node package docs](https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method) for creating new Service Accounts. |
| PRIVATE_KEY  | The key used to authenticate the google account |
| SHEET_ID     | Google sheet ID, can be found in URL |
| API_BASE     | Base URL of API, including trailing slash |
| API_KEY      | Key to authenticate with API, if required |
