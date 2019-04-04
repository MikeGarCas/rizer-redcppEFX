const TAX_CODE_ID = '5';
const CUSTOMER_ID = '670';
const APPROVED = '2';

define(['N/record'], (record) => {
  const _setInfo = (createdRecord, info) => {
    for (const field in info) {
      if (info.hasOwnProperty(field)) {
        createdRecord.setValue({
          fieldId: field,
          value: info[field],
          ignoreFieldChange: true,
        });
      }
    }
  };

  const _addItem = (createdRecord, item) => {
    createdRecord.selectNewLine({sublistId: 'item'});
    for (const field in item) {
      if (item.hasOwnProperty(field)) {
        createdRecord.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: field,
          value: item[field],
        });
      }
    }
    createdRecord.commitLine({sublistId: 'item'});
  };

  const _save = (createdRecord) => {
    return createdRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: true,
    });
  };

  const customRecordFactory = () => {
    const defaultInfo = {
      name: 'error',
    };
    const customRecord = record.create({
      type: 'customrecord_vend_custom_record',
    });
    return {
      setInfo: (newInfo) => {
        const info = Object.assign({}, defaultInfo, newInfo);
        logGeneral('Custom record factory - setInfoOf', info.name);
        _setInfo(customRecord, info);
      },
      save: () => _save(customRecord),
    };
  };

  const invoiceFactory = ({form, subsidiary}) => {
    const defaultInfo = {
      custbody_efx_pos_origen: true,
      // approvalstatus: APPROVED,
    };
    const defaultItem = {
      tax_code: TAX_CODE_ID,
    };
    const invoice = record.create({
      type: record.Type.INVOICE,
      isDynamic: true,
      defaultValues: {
        customform: form,
        entity: CUSTOMER_ID,
        subsidiary: subsidiary,
      },
    });
    return {
      setInfo: (newInfo) => {
        const info = Object.assign({}, defaultInfo, newInfo);
        logGeneral('Invoice factory - setInfo', JSON.stringify(info));
        _setInfo(invoice, info);
      },
      addItem: (newItem) => {
        const item = Object.assign({}, defaultItem, newItem);
        _addItem(invoice, item);
      },
      save: () => _save(invoice),
    };
  };

  const logGeneral = (title, msg) => {
    log.audit({
      title: title,
      details: msg,
    });
  };

  return {
    invoiceFactory: invoiceFactory,
    customRecordFactory: customRecordFactory,
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
