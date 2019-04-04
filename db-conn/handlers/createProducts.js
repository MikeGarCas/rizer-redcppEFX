const nyscollectionFetch = require('../connectors/nyscollectionFetch');
const accesoriosrizerFetch = require('../connectors/accesoriosrizerFetch');

let fetcher = nyscollectionFetch;

module.exports = async (products, store) => {
  try {
    fetcher = (store === 'nyscollection' ? nyscollectionFetch : accesoriosrizerFetch);
    const promises = products.map(async (product) => {
        const vendProduct = await fetcher.adjustInventory(product);
        return {
            sku: product.sku,
            id: vendProduct.product.id,
        };
    });
    return Promise.all(promises);
  } catch (error) {
    return {
      error: error.name,
      error_msg: error.message,
    };
  }
};
