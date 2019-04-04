const LOG_FOLDER = 593;
const ACC_SUBSIDIARY = '2';
const NYS_SUBSIDIARY = '3';
const ACC_FORM = '190';
const NYS_FORM = '191';

/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *New invoice (Vend->NS)
 */
const MODULES = ['N/record', 'N/error', 'N/file', 'N/search', './utils_invoice.js'];
define(MODULES, (record, error, file, search, utils) => {
  const processTicket = (jsonContents) => {
    try {
      const customRecordId = createCustomRecord(jsonContents);

      // Invoice
      const items = obtainProducts(jsonContents.payload.register_sale_products);
      if (items.length === 0) {
        _errMissingData({items});
      }
      const invoiceId = createInvoiceRecord(items, jsonContents.payload);
      const pid = createPaymentRecord(invoiceId, extractAmount(items));

      // Validate successfull creation
      if (!(invoiceId && pid)) {
        _errMissingData({invoiceId, pid});
      }

      // Everything went all-right
      addInvoiceToCustomRecord(customRecordId, invoiceId);
      logGeneral('Restlet - ok', extractName(jsonContents));
      return extractName(jsonContents);
    } catch (err) {
      logGeneral('Restlet - fail', err);
    }
  };

  /*
  ******************************************************************************
  * Products
  ******************************************************************************
  */

  const obtainProducts = (products) => {
    const skuList = products.map((product) => product.sku);
    const localInfoOfSku = productsDict(skuList);

    const productsWithAllInfo = products
      .map((product) =>
        Object.assign({}, product, localInfoOfSku[product.sku]))
      .filter((product) => product.internal_id);

    logGeneral('ITEMS', productsWithAllInfo.map(d => d.sku));
    return productsWithAllInfo;
  };

  const productsDict = (skuList) => {
    logGeneral('SKU List', skuList);

    // Search
    const searchOperation = search.create({
      type: search.Type.INVENTORY_ITEM,
      filters: filtersFromSkuList(skuList),
      columns: ['itemid'],
    });

    // Traverse search-data
    const itemDict = {};
    searchOperation.run().each((product) => {
      const item = extractItem(product);
      if (!itemDict[item.sku]) {
        itemDict[item.sku] = item;
      }
      return true; // continue iterating data
    });

    return itemDict;
  };

  const filtersFromSkuList = (skuList) => {
    let filters = [];
    for (let i = 0; i < skuList.length; ++i) {
      if (i !== 0) {
        filters.push('or');
      }
      filters.push(['itemid', search.Operator.IS, skuList[i]]);
    }
    return filters;
  };

  const extractItem = (product) => ({
    internal_id: product.id,
    sku: product.getValue({name: 'itemid'}),
  });

  /*
  ******************************************************************************
  * Custom Record
  ******************************************************************************
  */

  const createCustomRecord = (jsonContents) => {
    try {
      const fileId = createFile(jsonContents);

      const creator = utils.customRecordFactory();
      creator.setInfo({
        name: extractName(jsonContents) || 'error',
        custrecord_vend_json: JSON.stringify(jsonContents),
        custrecord_vend_file: fileId,
      });
      const customRecordId = creator.save();

      logGeneral('Custom record - ok', customRecordId);
      return customRecordId;
    } catch (err) {
      logGeneral('Custom record - failed', err);
    }
  };

  const createFile = (fileContents) => {
    const newFile = file.create({
      name: extractName(fileContents) + '.json',
      fileType: file.Type.JSON,
      contents: JSON.stringify(fileContents),
    });
    newFile.folder = LOG_FOLDER;
    return newFile.save();
  };

  const addInvoiceToCustomRecord = (customRecordId, invoiceId) => {
    const editedRecordId = record.submitFields({
      type: 'customrecord_vend_custom_record',
      id: customRecordId,
      values: {
        custrecord_vend_id_netsuite_invoice: invoiceId,
      },
      options: {
        enableSourcing: true,
        ignoreMandatoryFields: true,
      },
    });
    logGeneral('Update custom record - ok', editedRecordId);
  };

  /*
  ******************************************************************************
  * Invoice
  ******************************************************************************
  */

  const createPaymentRecord = (invoiceId, amount) => {
    try {
      const customerPayment = record.transform({
        fromType: record.Type.INVOICE,
        fromId: invoiceId,
        toType: record.Type.CUSTOMER_PAYMENT,
        isDynamic: true,
      });
      customerPayment.setValue({
        fieldId: 'payment',
        value: amount,
        ignoreFieldChange: true,
      });
      const customerPaymentId = customerPayment.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
      logGeneral('Create Payment - ok', customerPaymentId);
      return customerPaymentId;
    } catch (err) {
      logGeneral('Create Payment - fail', err);
    }
  };

  const createInvoiceRecord = (items, payload) => {
    try {
      const vendId = payload.id;
      const form = (payload.store === 'nyscollection' ? NYS_FORM : ACC_FORM);
      const subsidiary = (payload.store === 'nyscollection' ? NYS_SUBSIDIARY : ACC_SUBSIDIARY);
      // Use Factory
      const creator = utils.invoiceFactory({form, subsidiary});
      creator.setInfo({
        memo: vendId,
        location: findLocation(payload.outlet_name.toUpperCase()),
      });
      logGeneral('Create Invoice', 'Adding items...');
      items.forEach((item) => {
        creator.addItem({
          item: item.internal_id,
          quantity: item.quantity,
          rate: parseFloat(item.price) / 1.16,
        });
      });
      logGeneral('Create Invoice', '... Finished');
      const invoiceId = creator.save();
      logGeneral('Create Invoice - ok', invoiceId);
      return invoiceId;
    } catch (err) {
      logGeneral('Create Invoice - fail', err);
    }
  };

  const findLocation = (outlet_name) => {
    logGeneral('finding location', outlet_name);
    // Search
    const searchOperation = search.create({
      type: search.Type.LOCATION,
      filters: [['name', search.Operator.IS, outlet_name]],
      columns: ['name'],
    });
    // Traverse search-data
    let result = {};
    searchOperation.run().each((location) => {
      result = extractLocation(location);
      return true;
    });
    logGeneral('location', result);
    return result.id;
  };

  /*
  ******************************************************************************
  * General
  ******************************************************************************
  */

  const _errMissingData = (obj) => {
    throw error.create({
      'name': 'VEND_ERR_MISSING_DATA',
      'message': obj,
      'notifyOff': true,
    });
  };

  const extractName = (contents) => {
    return contents.payload.invoice_number;
  };

  const extractLocation = (location) => ({
    id: location.id,
    name: location.getValue({name: 'name'}),
  });

  const extractAmount = (items) => {
    let amount = 0;
    items.forEach(item => {
      amount += parseFloat(item.price_total);
    });
    return amount;
  };

  const logGeneral = (title, msg) => {
    log.audit({
      title: title,
      details: msg,
    });
  };

  return {
    post: processTicket,
  };
});

if (typeof Object.assign != 'function') {
  Object.defineProperty(Object, 'assign', {
    value: function assign(target, constArgs) {
      'use strict';
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      const to = Object(target);
      for (let index = 1; index < arguments.length; index++) {
        // eslint-disable-line
        const nextSource = arguments[index]; // eslint-disable-line
        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true,
  });
}
