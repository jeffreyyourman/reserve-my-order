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

const emailFunction = (subject, body) => {
  const mailOptions = {
    from: "jeffreyyourman@gmail.com", 
    to: "jeffreyyourman@gmail.com", 
    subject: `${subject}`, 
    html: `<p>${body}</p>` 
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
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
    const browser = await puppeteer.launch({ headless: true }); // default is true
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 800 });
    await page.setDefaultTimeout(0);

    await page.goto("https://secure.shoprite.com/User/SignIn/3601");

    await page.waitForSelector("input#Email", { visible: true });

    await page.type("input#Email", "jeffreyyourman@gmail.com", { delay: 10 });

    await page.type("input#Password", "Foofoo24.", { delay: 10 });

    await page.click("button#SignIn");

    await page.goto("https://shop.shoprite.com/store/0624283");

    await page.waitForSelector("#ReserveTimeSlotLink", { visible: true });

    await page.click("#ReserveTimeSlotLink");

    await page.waitForSelector(
      " div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div",
      { visible: true }
    );

    //forpickup
    await page.click(
      "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div > button"
    );

    //fordelivery
    // await page.click(
    //   "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--delivery > div > button"
    // );

    await page.waitForSelector("div.fulfillmentForm__selectInfo", {
      visible: true
    });
    // setInterval(function(){ alert("Hello"); }, 3000);

    const timeSlots = await page.$$eval(
      ".timeslotPicker__timeslotButton",
      buttons => buttons.map(button => button.disabled)
    );

    console.log("allAvailableTimeSlots", timeSlots.length);
    const isDisabled = timeSlots.includes(false);
    //if isDisabled === true that means it found a button to click
    //if isDisabled === false : means nothing in the array was returned false (not disabled);
    if (isDisabled) {
      //click button
      ////break
      console.log("found an opening");
      emailFunction('FOUND ONE', 'FOUND ONE - CHECK SHOPRITE')
    } else {
      console.log("no opening found");
      recheckTimeSlots(page);
      // await page.reload({ waitUntil: ["networkidle2", "domcontentloaded"] });
    }

    //continiously loop over the for loop until it finds an open timeslot.
    // for (const [index, timeSlot] of timeSlots.entries()) {
    //   console.log("timeSlotDisabled: ", { index, timeSlot });
    //   if (!timeSlot) {
    //     //click button
    //     //break
    //   }
    // }
    //wait for selector on next page
  } catch (e) {
    console.log("error: ", e);
  }
})();

const recheckTimeSlots = async (page) => {
  // console.log('page',page);
  await page.reload({ waitUntil: ["networkidle2", "domcontentloaded"] });
  await page.waitForSelector(
    " div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div",
    { visible: true }
  );

  //forpickup
  await page.click(
    "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--pickup > div > button"
  );

  //fordelivery
  // await page.click(
  //   "div.fulfillmentOptions__fulfillmentOption.fulfillmentOptions__fulfillmentOption--delivery > div > button"
  // );

  await page.waitForSelector("div.fulfillmentForm__selectInfo", {
    visible: true
  });

  const timeSlots = await page.$$eval(
    ".timeslotPicker__timeslotButton",
    buttons => buttons.map(button => button.disabled)
  );

  console.log("allAvailableTimeSlots", timeSlots.length);
  const isDisabled = timeSlots.includes(false);
  if (isDisabled) {
    console.log("found an opening");
    emailFunction('FOUND ONE', 'FOUND ONE - CHECK SHOPRITE')
  } else {
    console.log("no opening found");
    delay(60000);
    recheckTimeSlots(page);
  }
};

