/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope SameAccount
 *Create new NS items in vend too (NS->Vend)
 */

const MODULES = ['N/record', 'N/search', 'N/https', 'N/format'];
define(MODULES, (record, search, https, format) => {
  const onRequest = (params) => {
    try {
      const newItemsWithSku = lastCreatedItems()
        .filter((item) => item.sku && !item.vend_id);
      logGeneral('items', newItemsWithSku);

      const compactItems = newItemsWithSku.map(extractItemCompact);

      const vendItems = sendListToApi(compactItems);
      const items = mergeBySku(newItemsWithSku, vendItems);

      items.forEach((item) => {
        addVendIdToItem(item.id, item.vend_id);
      });
      printHtml({params, items:items});
    } catch (err) {
      logGeneral('Error', err);
    }
  };

  const extractItem = (item) => ({
    id: item.id,
    sku: item.getValue({name: 'itemid'}),
    name: item.getValue({name: 'displayname'}),
    handle: item.getValue({name: 'displayname'}),
    supply_price: parseFloat(item.getValue({name: 'cost'})) * 1.16,
    retail_price: parseFloat(item.getValue({name: 'price'})) * 1.16,
    vend_id: item.getValue({name: 'custitem_vend_id_item'}),
  });

  const extractItemCompact = (item) => ({
    sku: item.sku,
    name: item.name,
    handle: item.handle,
    supply_price: item.supply_price,
    retail_price: item.retail_price,
  });

  const lastCreatedItems = () => {
    // http://www.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2017_2/script/record/item.html
    let time = new Date();
    time.setDate(time.getDate() - 1);
    const formateddate = formatDate(time);
    logGeneral('After date:', formateddate);
    return runSearch({
      type: search.Type.INVENTORY_ITEM,
      filters: [
        ['created','after',formateddate],
      ],
      columns: [
        'itemid',
        'created',
        'displayname',
        'custitem_vend_id_item',
        'cost',
        'price',
      ],
      extractor: extractItem,
    });
  };

  const formatDate = (date) => {
    return format.format({value:date,type:format.Type.DATE});
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
      url: 'https://rizer-redcppe.now.sh/nyscollection/create-products',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    logGeneral('Api response', JSON.parse(response.body));
    return JSON.parse(response.body);
  };

  const mergeBySku = (completeItems, vendItems) => {
    const idMap = vendItemsDict(vendItems);
    completeItems.forEach((item) => {
      item.vend_id = idMap[item.sku];
    });
    return completeItems;
  };

  const vendItemsDict = (vendItems) => {
    let dict = {};
    vendItems.forEach((item) => {
      dict[item.sku] = item.id;
    });
    return dict;
  };

  const printHtml = ({params, items, locationsInfo}) => {
    let html = '<h2>Items</h2>';
    html += '<br />';
    html += items.map(d => JSON.stringify(d)).join('<br />');
    params.response.write({ output: html });
  };

  const addVendIdToItem = (itemId, vendId) => {
    const editedRecordId = record.submitFields({
      type: search.Type.INVENTORY_ITEM,
      id: itemId,
      values: {
        custitem_vend_id_item: vendId,
      },
      options: {
        enableSourcing: true,
        ignoreMandatoryFields: true,
      },
    });
    logGeneral('Update custom record - ok', editedRecordId);
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