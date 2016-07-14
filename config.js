module.exports = {
  env: process.env.NODE_ENV || 'development',
  apiBase: process.env.API_BASE,
  apiKey: process.env.API_KEY,
  sheetId: process.env.SHEET_ID,
  googleEmail: process.env.CLIENT_EMAIL,
  googleKey: process.env.PRIVATE_KEY,
};
