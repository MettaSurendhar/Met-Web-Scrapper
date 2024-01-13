const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');

const url =
	'https://www.amazon.in/ASUS-Vivobook-i7-12650H-Laptop-X1502ZA-EJ741WS/dp/B0C5N2SM8K/';

async function configureBrowser() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url);
	return page;
}
//

function parseNumberFromString(str) {
	const cleanStr = str.replace(/[,\.]/g, '');
	const numberValue = parseFloat(cleanStr);
	if (!isNaN(numberValue)) {
		return numberValue;
	} else {
		console.error(`Unable to parse "${str}" as a number.`);
		return null;
	}
}

async function checkPrice(page) {
	await page.reload();
	let html = await page.evaluate(() => document.body.innerHTML);
	const $ = cheerio.load(html);
	const firstPrice = $('.a-price-whole').first().text();
	const currentPrice = parseNumberFromString(firstPrice);
	if (currentPrice < 60000) {
		console.log('BUY!!!!!.....IT the price is :' + currentPrice);
	}
	sendNotification(currentPrice);
}

async function takeScreenShot(page, fileName) {
	const directoryPath = path.join(__dirname, 'ss');
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath);
	}
	const screenShotPath = path.join(directoryPath, fileName);
	await page.screenshot({ path: screenShotPath });
}

async function monitor() {
	const page = await configureBrowser();
	await takeScreenShot(page, 'sc1.png');
	await checkPrice(page);
}

async function startTracking() {
	const page = await configureBrowser();
	await takeScreenShot(page, `sc${(Math.random() * 1000).toPrecision(3)}.png`);
	let job = new CronJob(
		'* */15 * * * *',
		function () {
			checkPrice(page);
		},
		null,
		true,
		null,
		null,
		true
	);
	job.start();
}

async function sendNotification(price) {
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: '*****@gmail.com',
			pass: '*****',
		},
	});

	let textToSend = 'Price dropped to ' + price;
	let htmlText = `<a href=\"${url}\">Link</a>`;

	let info = await transporter.sendMail({
		from: '"Price Tracker" <*****@gmail.com>',
		to: '*****@gmail.com',
		subject: 'Price dropped to ' + price,
		text: textToSend,
		html: htmlText,
	});

	console.log('Message sent: %s', info.messageId);
}

startTracking();
