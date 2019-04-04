const nsrestlet = require('nsrestlet');

// For OAuth (we can do NLAuth too, see documentation):
const accountSettings = {
  accountId: '5102991',
  tokenKey: '5deef8c9565250ffc9b9613a8d331e394aad1430627ed3bd33fead134b27c511',
  tokenSecret: 'bc1f39ff918d106130867747627b3b51b7fbd213bb1fc1f80068a330dadb6b9d',
  consumerKey: '65d7875e8cf5102a86ba9be5aa966359900cb7efaddaec35e89cba414869ccb0',
  consumerSecret: '181ecea54bfa7e97fdb09eaa110ccbb72a73cfa18d9ca5b807b1d68c0448fd6a',
};
const urlSettings = {
  url: 'https://5102991.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=351&deploy=1',
  bdmonlup: '097e6eb1ef4ad73d27689abdf11b86e6',
};

// create a link
const connection = nsrestlet.createLink(accountSettings, urlSettings);

const post = (data) => {
  return new Promise((resolve, reject) => {
    connection
      .post(data)
      .then((body) => {
        resolve(body);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = {
  post: post,
};
