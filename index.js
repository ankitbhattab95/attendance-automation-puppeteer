const express = require('express')
const puppeteer = require('puppeteer');
require('dotenv').config()
const nodemailer = require("nodemailer");
const smtpTransport = require('nodemailer-smtp-transport');
const app = express()
const PORT = process.env.PORT || 3000


const begin = async (actionId) => {
    const userName = process.env.USERNAME
    const password = process.env.PASSWORD
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(process.env.URL);
    await page.type('input[id=P515_USERNAME]', userName)
    await page.type('input[id=P515_PASSWORD]', password)
    await page.click('#B142330463764352491')

    await page.waitForNavigation();

    await page.click('#SR_R672732339046502638_tab') // Pin-board tab
    await page.click('#' + actionId) // punch-in or punch-out
    await sleep(process.env.SLEEP_TIME);

    await page.click('#ATTEN_REP_BTN_ID')
    await sleep(process.env.SLEEP_TIME);

    const name = (new Date).toLocaleString().replace(' ', '').split('/').join('-') + '.png'
    await page.screenshot({ path: name, clip: { x: 0, y: 0, height: 1000, width: 1050 } });
    await browser.close();

    // mail init
    const filename = name
    const path = './' + name
    const subject = 'LOGIN success'
    await sendMail(filename, path, subject);
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMail(filename, path, subject) {
    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: process.env.FROM_MAIL,
            pass: process.env.APP_PASS
        }
    }));

    const info = await transporter.sendMail({
        from: `Attendance-mailer" <${process.env.FROM_MAIL}>`,
        to: process.env.FROM_MAIL,
        subject,
        attachments: [{
            filename,
            path
        }]
    });

    console.log("Message sent: %s", info.messageId);
}

app.get('/login', (req, res) => {
    begin('P1_PUNCH_IN')
})

app.get('/logout', (req, res) => {
    begin('P1_PUNCH_OUT')
})

app.get('/', (req, res) => {
    res.send('test')
})

app.listen(PORT, () => console.log(`App listening on port=${PORT}`))