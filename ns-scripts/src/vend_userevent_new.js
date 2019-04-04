/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 *Create product (NS->Vend->NS)
 */

 define(['N/record', 'N/search', 'N/https'], (record, search, https) => {
  const beforeSubmit = (ctx) => {
    if (ctx.type !== ctx.UserEventType.CREATE) {
      logGeneral(ctx.type)
      return;
    }
    try {
      logGeneral('Captured', ctx.newRecord);
      const product = extractProduct(ctx.newRecord);
      createProductVend(product);
    } catch (err) {
      logGeneral('Error', err);
    }
  };

  const createProductVend = (body) => {
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
    beforeSubmit: beforeSubmit
  };
 });
