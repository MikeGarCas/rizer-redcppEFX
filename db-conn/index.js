const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('koa-logger');

const handleSaleUpdate = require('./handlers/saleUpdate');
const handleCreateProducts = require('./handlers/createProducts');
const handleInventoryAdjustment = require('./handlers/inventoryAdjustment');

const router = new Router();
const app = new Koa();
app.use(logger());
app.use(bodyParser());

const urlList = [
  { url: '/:store/sale-update', fun: handleSaleUpdate },
  // { url: '/:store/create-products', fun: handleCreateProducts },
  // { url: '/:store/inventory-adjustment', fun: handleInventoryAdjustment },
];

urlList.forEach(({url, fun}) => {
  router.post(url, async (ctx) => {
    ctx.body = await fun(ctx.request.body, ctx.params.store);
  });
})

const server = app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000);

console.log('http://127.0.0.1:3000');