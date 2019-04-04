const nyscollectionFetch = require('../connectors/nyscollectionFetch');
const accesoriosrizerFetch = require('../connectors/accesoriosrizerFetch');

let fetcher = nyscollectionFetch;

const groupByProduct = (list) => {
  /* {
    id: 3e691360-9ba3-45ef-6a2e-308c868e773b,
    inventory : [
      { outlet_id: 31eb0866-e7ad-11e5-e556-146009cea84f, count: 2319 }
    ]
  } */
  const dict = {};
  list.forEach(({productId, outletId, quantity}) => {
    if (!dict.hasOwnProperty(productId)) {
      dict[productId] = {
        id: productId,
        inventory: [],
      };
    }
    dict[productId].inventory.push({
      outlet_id: outletId,
      count: quantity,
    })
  });
  return Object.values(dict);
};

module.exports = async (groups, store) => {
  try {
    fetcher = (store === 'nyscollection' ? nyscollectionFetch : accesoriosrizerFetch);
    const list = groupByProduct(groups);
    const promises = list.map((fullItem) => {
      return fetcher.adjustInventory(fullItem)
    });
    return {ok: 'Correctly received inventory adjustments'};
  } catch (error) {
    return {
      error: error.name,
      error_msg: error.message,
    };
  }
};
