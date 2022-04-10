const express = require('express')
const puppeteer = require('puppeteer');
require('dotenv').config()
const nodemailer = require("nodemailer");
const smtpTransport = require('nodemailer-smtp-transport');
const app = express()
const PORT = process.env.PORT || 3000
console.log(">.........process.env.URL", typeof (process.env.URL))

const begin = async (actionId, action) => {
    const userName = process.env.USERNAME
    const password = process.env.PASSWORD
    // const browser = await puppeteer.launch({ headless: true });
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(process.env.URL);
    await page.type('input[id=P515_USERNAME]', userName)
    await page.type('input[id=P515_PASSWORD]', password)
    await page.click('#B142330463764352491')

    await page.waitForNavigation();

    console.log("> authentication successful")
    await page.click('#SR_R672732339046502638_tab') // Pinboard tab
    await page.click('#' + actionId) // punch-in or punch-out

    console.log("> action successful", action)
    await sleep(process.env.SLEEP_TIME);

    console.log("> view attendance logs", action)
    await page.click('#ATTEN_REP_BTN_ID')
    await sleep(process.env.SLEEP_TIME);

    const name = (new Date).toLocaleString().replace(' ', '').split('/').join('-') + '.png'
    await page.screenshot({ path: name, clip: { x: 0, y: 0, height: 1000, width: 1050 } });
    await browser.close();

    // mail init
    const filename = name
    const path = './' + name
    let subject = getSubject(action);
    await sendMail(filename, path, subject);
};

function getSubject(action) {
    let subject = '';
    if (action === 'login') {
        subject = 'LOGIN success';
    } else if (action === 'logout') {
        subject = 'LOGOUT success';
    }
    return subject;
}

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
    begin('P1_PUNCH_IN', 'login')
    res.send('login process initiated')
})

app.get('/logout', (req, res) => {
    begin('P1_PUNCH_OUT', 'logout')
    res.send('logout process initiated')
})

app.get('/', (req, res) => {
    console.log(">.....process.env.USERNAME", process.env.USERNAME)
    console.log(">.....process.env.PASSWORD", process.env.PASSWORD)
    console.log(">.....process.env.URL", process.env.URL)
    console.log(">.....process.env.APP_PASS", process.env.APP_PASS)
    console.log(">.....process.env.FROM_MAIL", process.env.FROM_MAIL)
    console.log(">.....process.env.SLEEP_TIME", process.env.SLEEP_TIME)
    res.send('test')
})

app.listen(PORT, () => console.log(`App listening on port=${PORT}`))