'use strict';var LOG_FOLDER=593,ACC_SUBSIDIARY='2',NYS_SUBSIDIARY='3',ACC_FORM='190',NYS_FORM='191',MODULES=['N/record','N/error','N/file','N/search','./utils_invoice.js'];/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *New invoice (Vend->NS)
 */define(MODULES,function(a,b,c,d,e){var f=function(a){var b=a.map(function(a){return a.sku}),c=g(b),d=a.map(function(a){return Object.assign({},a,c[a.sku])}).filter(function(a){return a.internal_id});return t('ITEMS',d.map(function(a){return a.sku})),d},g=function(a){t('SKU List',a);// Search
var b=d.create({type:d.Type.INVENTORY_ITEM,filters:h(a),columns:['itemid']}),c={};// Traverse search-data
return b.run().each(function(a){var b=i(a);return c[b.sku]||(c[b.sku]=b),!0;// continue iterating data
}),c},h=function(a){for(var b=[],c=0;c<a.length;++c)0!==c&&b.push('or'),b.push(['itemid',d.Operator.IS,a[c]]);return b},i=function(a){return{internal_id:a.id,sku:a.getValue({name:'itemid'})}},j=function(a){try{var b=k(a),c=e.customRecordFactory();c.setInfo({name:q(a)||'error',custrecord_vend_json:JSON.stringify(a),custrecord_vend_file:b});var d=c.save();return t('Custom record - ok',d),d}catch(a){t('Custom record - failed',a)}},k=function(a){var b=c.create({name:q(a)+'.json',fileType:c.Type.JSON,contents:JSON.stringify(a)});return b.folder=LOG_FOLDER,b.save()},l=function(b,c){var d=a.submitFields({type:'customrecord_vend_custom_record',id:b,values:{custrecord_vend_id_netsuite_invoice:c},options:{enableSourcing:!0,ignoreMandatoryFields:!0}});t('Update custom record - ok',d)},m=function(b,c){try{var d=a.transform({fromType:a.Type.INVOICE,fromId:b,toType:a.Type.CUSTOMER_PAYMENT,isDynamic:!0});d.setValue({fieldId:'payment',value:c,ignoreFieldChange:!0});var e=d.save({enableSourcing:!0,ignoreMandatoryFields:!0});return t('Create Payment - ok',e),e}catch(a){t('Create Payment - fail',a)}},n=function(a,b){try{var c=b.id,d='nyscollection'===b.store?NYS_FORM:ACC_FORM,f='nyscollection'===b.store?NYS_SUBSIDIARY:ACC_SUBSIDIARY,g=e.invoiceFactory({form:d,subsidiary:f});// Use Factory
g.setInfo({memo:c,location:o(b.outlet_name.toUpperCase())}),t('Create Invoice','Adding items...'),a.forEach(function(a){g.addItem({item:a.internal_id,quantity:a.quantity,rate:parseFloat(a.price)/1.16})}),t('Create Invoice','... Finished');var h=g.save();return t('Create Invoice - ok',h),h}catch(a){t('Create Invoice - fail',a)}},o=function(a){t('finding location',a);// Search
var b=d.create({type:d.Type.LOCATION,filters:[['name',d.Operator.IS,a]],columns:['name']}),c={};// Traverse search-data
return b.run().each(function(a){return c=r(a),!0}),t('location',c),c.id},p=function(a){throw b.create({name:'VEND_ERR_MISSING_DATA',message:a,notifyOff:!0})},q=function(a){return a.payload.invoice_number},r=function(a){return{id:a.id,name:a.getValue({name:'name'})}},s=function(a){var b=0;return a.forEach(function(a){b+=parseFloat(a.price_total)}),b},t=function(a,b){log.audit({title:a,details:b})};/*
  ******************************************************************************
  * Products
  ******************************************************************************
  *//*
  ******************************************************************************
  * Custom Record
  ******************************************************************************
  *//*
  ******************************************************************************
  * Invoice
  ******************************************************************************
  *//*
  ******************************************************************************
  * General
  ******************************************************************************
  */return{post:function g(a){try{var b=j(a),c=f(a.payload.register_sale_products);// Invoice
0===c.length&&p({items:c});var d=n(c,a.payload),e=m(d,s(c));// Validate successfull creation
return d&&e||p({invoiceId:d,pid:e}),l(b,d),t('Restlet - ok',q(a)),q(a)}catch(a){t('Restlet - fail',a)}}}}),'function'!=typeof Object.assign&&Object.defineProperty(Object,'assign',{value:function(a){'use strict';if(null==a)throw new TypeError('Cannot convert undefined or null to object');for(var b,c=Object(a),d=1;d<arguments.length;d++)// eslint-disable-line
if(b=arguments[d],null!=b)for(var e in b)Object.prototype.hasOwnProperty.call(b,e)&&(c[e]=b[e]);return c},writable:!0,configurable:!0});