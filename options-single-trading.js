// node options-single-trading.js "200717 BIDU Call 115"

require("dotenv").config({ path: __dirname + "/.env" });
const puppeteer = require("puppeteer");
const LoggerModule = require("./logger");

function countDecimals(value) {
  if (Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
}

function getStrikeInNasdaqUrlForOptions(strikeValue) {
  const maxDecimalDigits = 3;
  const maxStrikeDigitCount = 8;

  let strike = strikeValue.replace(".", "");

  const decimalDigits = countDecimals(parseFloat(strikeValue));
  let allowedDecimalDigits = maxDecimalDigits - decimalDigits;
  while (allowedDecimalDigits) {
    strike += "0";
    allowedDecimalDigits--;
  }

  let remainingDigitCount = maxStrikeDigitCount - strike.length;
  while (remainingDigitCount) {
    strike = "0" + strike;
    remainingDigitCount--;
  }

  return strike;
}

function sprintf(format) {
  for (var i = 1; i < arguments.length; i++) {
    format = format.replace(/%s/, arguments[i]);
  }
  return format;
}

function getNasdaqUrlForOptions(expiry, scripName, callPut, strike) {
  scripName = scripName.toLowerCase();
  callPut = callPut.toLowerCase();
  strike = getStrikeInNasdaqUrlForOptions(strike);
  console.log(
    sprintf(
      "https://old.nasdaq.com/symbol/%s/option-chain/%s%s%s-%s-%s",
      scripName,
      expiry,
      callPut[0].toUpperCase(),
      strike,
      scripName,
      callPut
    )
  );
  return sprintf(
    "https://old.nasdaq.com/symbol/%s/option-chain/%s%s%s-%s-%s",
    scripName,
    expiry,
    callPut[0].toUpperCase(),
    strike,
    scripName,
    callPut
  );
}

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
    const pageUrl = getNasdaqUrlForOptions(expiry, symbol, callPut, strike);
    try {
      await page.goto(pageUrl);
    } catch (exc) {
      logger
        .sendMessageToSlack("Jaysomaney " + pageUrl + " unable to load")
        .then(() => {
          process.exit();
        });
    }

    let lastSale = await page.evaluate(() => {
      var lastSaleRef = document.querySelector("#opdetails-last > .floatR > b");
      if (lastSaleRef !== null) {
        return lastSaleRef.innerText;
      }
      return "undefined";
    });

    lastSaleList.push(lastSale);
  }
  console.log(lastSaleList.join(" "));
  await browser.close();
  process.exit();
})();
