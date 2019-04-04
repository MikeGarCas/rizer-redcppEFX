const fs = require('fs');
const nsFetch = require('../connectors/nsFetch');

const main = async () => {
  const file = fs.readFileSync('../json/product_update.json', 'utf8');
  const json = JSON.parse(file);
  console.log('Uploading:', JSON.stringify(json,null,2));
  const res = await nsFetch.post(json);
  console.log('Uploaded:', res);
};

main();
