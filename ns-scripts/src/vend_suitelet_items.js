/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope SameAccount
 *Update vend item count (NS->Vend)
 */

 define(['N/record', 'N/search', 'N/https', 'N/format'], (record, search, https, format) => {
  const onRequest = (params) => {
    try {
      const locationsInfo = locationsDict();
      const itemsWithSku = lastModifiedItems().filter((item) => item.sku);

      const vendItems = itemsWithSku
        .map((item) => {
          const info = locationsInfo[item.location];
          item.location_vend_id = info && info.vend_id;
          return item;
        })
        .filter((item) => item.vend_id && item.location_vend_id);

      const compactItems = vendItems.map(extractItemCompact);

      sendListToApi(compactItems);
      printHtml({params, items:vendItems, locationsInfo});
    } catch (err) {
      logGeneral('Error', err);
    }
  };

  const extractItemCompact = (item) => ({
    quantity: item.quantity,
    productId: item.vend_id,
    outletId: item.location_vend_id,
  });

  const extractLocation = (location) => ({
    id: location.getValue({name: 'internalid'}),
    name: location.getValue({name: 'name'}),
    vend_id: location.getValue({name: 'custrecord_vend_id_location'}),
  });

  const extractItem = (item) => ({
    sku: item.getValue({name: 'itemid'}),
    name: item.getValue({name: 'displayname'}),
    modified: item.getValue({name: 'modified'}),
    location: item.getValue({name: 'inventorylocation'}),
    quantity: item.getValue({name: 'locationquantityavailable'}),
    vend_id: item.getValue({name: 'custitem_vend_id_item'}),
  });

  const extractItemFromTransactionSearch = (item) => {
    return item.id;
  };

  const printHtml = ({params, items, locationsInfo}) => {
    let html = '<h2>Items</h2>';
    html += '<br />';
    html += items.map(d => JSON.stringify(d)).join('<br />');
    html += '<br />';
    html += '<h2>Locations</h2>';
    html += JSON.stringify(locationsInfo, null, 4);
    params.response.write({ output: html });
  };

  const locationsDict = () => {
    const locations = runSearch({
      type: search.Type.LOCATION,
      filters: [],
      columns: ['internalid', 'name', 'custrecord_vend_id_location'],
      extractor: extractLocation,
    });
    const dict = {};
    locations.filter(l => l.vend_id).forEach(l => {
      dict[l.id] = l;
    });
    return dict;
  };

  const lastModifiedItems = () => {
    // http://www.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2017_2/script/record/item.html
    const ids = lastTransactions();
    logGeneral('ids', ids);
    return runSearch({
      type: search.Type.INVENTORY_ITEM,
      filters: [
        ['internalid','anyof',ids],
      ],
      columns: [
        'itemid',
        'location',
        'modified',
        'displayname',
        'inventorylocation',
        'locationquantityavailable',
        'custitem_vend_id_item',
      ],
      extractor: extractItem,
    });
  };

  const lastTransactions = () => {
    // Consulta última actualización artículos de inventario v0.1
    const searchOperation = search.load({
      id: 'customsearch203',
    });
    let items = [];
    searchOperation.run().each((item) => {
      items.push(extractItemFromTransactionSearch(item));
      return true;
    });
    return items.filter(onlyUnique);
  };

  const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
  };

  const runSearch = ({type, filters, columns, extractor=(x=>x)}) => {
    const searchOperation = search.create({
      type: type,
      filters: filters,
      columns: columns,
    });
    let items = [];
    searchOperation.run().each((item) => {
      items.push(extractor(item));
      return true;
    });
    return items;
  };

  const sendListToApi = (body) => {
    logGeneral('Send body to api', body);
    const response = https.post({
      body: JSON.stringify(body),
      url: 'https://rizer-redcppe.now.sh/nyscollection/inventory-adjustment',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    logGeneral('Api response', JSON.parse(response.body));
    return response;
  };

  const logGeneral = (title, msg) => {
    log.audit({
      title: title,
      details: msg,
    });
  };

  return {
    onRequest: onRequest
  };
});