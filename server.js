const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const keys = require("./keys.js");
const nodemailer = require("nodemailer");
// Login to https://www.google.com/settings/security/lesssecureapps and TURN ON Access for less secure apps.
//need to figure out when the next day is added.
// as of 11:35am. Monday April 6th.
// as of 6:22pm. Monday April 7th.
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: keys.emailUsername,
    pass: keys.emailPassword
  }
});
// app.get('/', async (req,res) => {
const emailFunction = (subject, body) => {
  const mailOptions = {
    from: "jeffreyyourman@gmail.com",
    to: "jeffreyyourman@gmail.com",
    subject: `${subject}`,
    html: `<p>${body}</p>`
  };
  transporter.sendMail(mailOptions, function(err, info) {
  });
};
// emailFunction('TESTTHIS', 'TEST THIS')
function delay(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process" // <- this one doesn't works in Windows
      ]
    });
    // const browser = await puppeteer.launch({ headless: false }); // default is true
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 800 });
    await page.setDefaultNavigationTimeout(0);

    await page.goto("https://secure.shoprite.com/User/SignIn/3601", {
      waitUntil: "networkidle2",
      timeout: 180000
    });

    await page.waitForSelector("input#Email", { visible: true });

    await page.type("input#Email", "jeffreyyourman@gmail.com", { delay: 150 });
    await delay(1000);

    await page.type("input#Password", "Foofoo24.", { delay: 150 });
    await delay(1000);

    await page.click("button#SignIn");
    await delay(1000);

    await page.goto("https://shop.shoprite.com/store/0624283", {
      waitUntil: "networkidle2",
      timeout: 180000
    });
    // .then(() => page.waitForNavigation({waitUntil: 'domcontentloaded'}));
    await page.waitForNavigation({ timeout: 0, waitUntil: "domcontentloaded" });
    // await page.waitForNavigation();

    await page.waitForSelector("#ReserveTimeSlotLink", {
      timeout: 0,
      visible: true
    });
    await delay(1000);

    await page.click("#ReserveTimeSlotLink");

    await page.waitForSelector(
      "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div",
      { timeout: 0, visible: true }
    );
    await delay(300);

    //forpickup
    await page.click(
      "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div > button"
    );

    //fordelivery
    // await page.click(
    //   "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--delivery > div > button"
    // );

    await page.waitForSelector("div.fulfillmentForm__selectInfo", {
      timeout: 0,
      visible: true
    });

    // https://shop.shoprite.com/store/0624283/User/ReturnFromSignIn?success=True&store=0624283&addressId=0?binding=urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST
    const timeSlots = await page.$$eval(
      ".timeslotPicker__timeslotButton",
      buttons =>
        buttons.map((button, index) => {

          return {isDisabled: button.disabled};
        })
    );
    const clickBtn = await page.$$('.timeslotPicker__timeslotButton');
    
    for (let i = 0; i < timeSlots.length; i++) {
      const element = timeSlots[i];
      if (!element.isDisabled) {
        emailFunction("FOUND ONE", "FOUND ONE - CHECK SHOPRITE");
        const clickBtn = await clickBtn[i];
        await clickBtn.click();
        await page.waitForSelector("div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary", {
          timeout: 0,
          visible: true
        });
        
        await page.click(
          "div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary > div.summarySidebar.timeslotSummary__actions > div.timeslotSummary__actions--tabletUp > a"
        );

      }
      if(i+1 === timeSlots.length) {
        console.log('no slots found');
        await delay(50000);
        recheckTimeSlots(page);
      }
    }
    //wait for selector on next page
  } catch (e) {
    console.log('error: ', e);
  }
})();

// ====================================================================

const recheckTimeSlots = async page => {
  await page.reload({ waitUntil: ["networkidle2", "domcontentloaded"] });
  await page.waitForSelector(
    "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div",
    { timeout: 0, visible: true }
  );
  await delay(300);

  //forpickup
  await page.click(
    "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div > button"
  );

  //fordelivery
  // await page.click(
  //   "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--delivery > div > button"
  // );

  await page.waitForSelector("div.fulfillmentForm__selectInfo", {
    timeout: 0,
    visible: true
  });
  const timeSlots = await page.$$eval(
    ".timeslotPicker__timeslotButton",
    buttons =>
      buttons.map((button, index) => {
        return {isDisabled: button.disabled};
      })
  );
  const clickBtn = await page.$$('.timeslotPicker__timeslotButton');
  for (let i = 0; i < timeSlots.length; i++) {
    const element = timeSlots[i];
    if (!element.isDisabled) {
      const clickBtn = await clickBtn[i];
      await clickBtn.click();
      await page.waitForSelector("div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary", {
        timeout: 0,
        visible: true
      });
      
      await page.click(
        "div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary > div.summarySidebar.timeslotSummary__actions > div.timeslotSummary__actions--tabletUp > a"
      );
    }
    if(i+1 === timeSlots.length) {
      console.log('no slots found');
      await delay(50000);
      recheckTimeSlots(page);
    }
  }
};
// res.send('hi')
// })

// const port = process.env.PORT || 8090;
// app.listen(port, () => 
// });












    // const isDisabled = timeSlots.includes(false);

    // if (isDisabled === foundone) {
    //   //click button
    //   ////break
      // emailFunction("FOUND ONE", "FOUND ONE - CHECK SHOPRITE");
    //   await page.click(
    //     "div.timeslotPicker_warper > div.timeslotPicker.checkoutStep__borderedContent > div.timeslotPicker__days > div:nth-child(9) > div:nth-child(6) > button" //need to click. Need to figure out what column and cell this button is in.
    //     // "div.timeslotPicker_warper > div.timeslotPicker.checkoutStep__borderedContent > div.timeslotPicker__days > div:nth-child(3) > div.timeslotPicker__timeslotButton--wrap.timeslotPicker__cell.is-selected > button" //is already selected.
    //   );
    //   //click reserve
    //   // #instance_685b5c70-c722-46a3-ab48-251886be9363 > div.timeslotPicker_warper > div.timeslotPicker.checkoutStep__borderedContent > div.timeslotPicker__days > div:nth-child(9) > div:nth-child(25) > button
    //   //after click, do wait for selector
    //   //WAITFOR : #instance_73d9961e-df04-4f11-b3ec-ddd12a4bdd29 > div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary
    //   // then do continue shopping
    //   //continue shopping buttons below.
    //   //tablet version
    //   //CLICK: #instance_44858df4-c552-4b84-833c-9752b9e1fc34 > div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary > div.summarySidebar.timeslotSummary__actions > div.timeslotSummary__actions--tabletUp > a
    //   //mobile version
    //   //CLICK: #instance_73d9961e-df04-4f11-b3ec-ddd12a4bdd29 > div.twoColumnLayout.twoColumnLayout--checkout > div.twoColumnLayout__secondary > div > div.summarySidebar.timeslotSummary > div.summarySidebar.timeslotSummary__actions > div.timeslotSummary__actions--mobile > a
    // } else {
    //   recheckTimeSlots(page);
    //   // await page.reload({ waitUntil: ["networkidle2", "domcontentloaded"] });
    // }