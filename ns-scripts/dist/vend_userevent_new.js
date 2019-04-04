'use strict';/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 *Create product (NS->Vend->NS)
 */define(['N/record','N/search','N/https'],function(a,b,c){var d=function(a){e('Send body to api',a);var b=c.post({body:JSON.stringify(a),url:'https://rizer-redcpp.now.sh/nyscollection/inventory-adjustment',headers:{Accept:'application/json',"Content-Type":'application/json'}});return e('Api response',JSON.parse(b.body)),b},e=function(a,b){log.audit({title:a,details:b})};return{beforeSubmit:function b(a){if(a.type!==a.UserEventType.CREATE)return void e(a.type);try{e('Captured',a.newRecord);var c=extractProduct(a.newRecord);d(c)}catch(a){e('Error',a)}}}});