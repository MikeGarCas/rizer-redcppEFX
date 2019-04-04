const nsFetch = require('../connectors/nsFetch');
const nyscollectionFetch = require('../connectors/nyscollectionFetch');
const accesoriosrizerFetch = require('../connectors/accesoriosrizerFetch');
const nyscollectionOutlets = require('../json/outlet_list_nyscollection.json');
const accesoriosrizerOutlets = require('../json/outlet_list_accesoriosrizer.json');

const listsToDict = (list) => {
  return list.reduce((result, outlet) => {
      result[outlet.id] = outlet.name;
      return result;
  },{});
};

const nyscollectionDict = listsToDict(nyscollectionOutlets);
const accesoriosrizerDict = listsToDict(accesoriosrizerOutlets);

let fetcher = nyscollectionFetch;
let dict = nyscollectionDict;

const extendProductsInfo = async (whData) => {
  try {
    for (const product of whData.payload.register_sale_products) {
      const data = await fetcher.fetchProduct(product.product_id);
      product.product_name = data.name;
      product.sku = data.sku;
    }
  } catch (err) {
    console.log(err);
  }
};

const extendOutletInfo = async (whData) => {
  const data = await fetcher.fetchSale(whData.payload.id);
  whData.payload.outlet_id = data.outlet_id;
  whData.payload.outlet_name = dict[data.outlet_id];
};

const isObject = (value) => {
  return value && typeof value === 'object' && value.constructor === Object;
};

module.exports = async (whData, store) => {
  try {
    if (store === 'nyscollection') {
      fetcher = nyscollectionFetch;
      dict = nyscollectionDict;
    } else {
      fetcher = accesoriosrizerFetch;
      dict = accesoriosrizerDict;
    }
    if (!isObject(whData.payload)) {
      whData.payload = JSON.parse(whData.payload);
    }
    whData.payload.store = store;
    await extendProductsInfo(whData);
    await extendOutletInfo(whData);
    nsFetch.post(whData);
    return { ok: 'received sale info' };
  } catch (error) {
    const result = {
      error: error.name,
      error_msg: error.message,
    };
    return result;
  }
};
