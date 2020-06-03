const request = require('request');

module.exports = class Logger {

  sendMessageToSlack(message) {
    return new Promise((resolve, reject) => {
      request.post({
        headers: {
          'Content-type': 'application/json'
        },
        url: process.env.SLACK_HOOK,
        body: '{"text":"' + process.env.APP_NAME + ' ' + process.env.APP_ENV + ' Message: ' + message + '"}'
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve();
        } else {
          console.log(error);
        }
      });
    });
  }

}