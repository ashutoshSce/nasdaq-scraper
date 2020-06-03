// node wallstreetsurvivor-option-trading.js "17:07:2020 BIDU Call 115"

require("dotenv").config({ path: __dirname + "/.env" });
const puppeteer = require("puppeteer");
const LoggerModule = require("./logger");

const params = process.argv[2];

(async () => {
  const logger = new LoggerModule();

  process.on("unhandledRejection", (err) => {
    logger
      .sendMessageToSlack("Jaysomaney Caught exception: " + err.toString())
      .then(() => {
        process.exit();
      });
  });

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  const paramsList = params.split(",");
  const lastSaleList = [];
  for (let index = 0; index < paramsList.length; index++) {
    let [expiry, symbol, callPut, strike] = paramsList[index].split(" ");
    const pageUrl =
      "https://app.wallstreetsurvivor.com/quote/" + symbol + "/option-chain";
    try {
      await page.goto(pageUrl);
    } catch (exc) {
      logger
        .sendMessageToSlack("Jaysomaney " + pageUrl + " unable to load")
        .then(() => {
          process.exit();
        });
    }

    await page.waitForSelector("#dk_container_optionchain-expiration");

    let lastSale = await page.evaluate(
      (strike, expiry, callPut) => {
        var strikeRef = document.querySelectorAll(
          'tr[data-exp-month-year="' + expiry + '"] td.strike-price'
        );
        var strikeRefLength = strikeRef.length;
        for (var i = 0; i < strikeRefLength; i++) {
          if (strikeRef[i].textContent.trim() === strike) {
            if (callPut === "Call") {
              return strikeRef[i].parentElement.children[0].textContent.trim();
            } else if (callPut === "Put") {
              return strikeRef[i].nextSibling.textContent.trim();
            }
            return "undefined";
          }
        }
        return "undefined";
      },
      strike,
      expiry,
      callPut
    );
    lastSaleList.push(lastSale);
  }
  console.log(lastSaleList.join(" "));
  await browser.close();
  process.exit();
})();
