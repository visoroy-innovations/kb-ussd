require('dotenv').config(); // Import dotenv to load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');  // Import Nodemailer

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Nodemailer configuration using Zoho SMTP and environment variables
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,      // Email from .env file
        pass: process.env.EMAIL_PASS       // Password from .env file
    }
});

// Function to send an email
const sendEmail = (message) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,      // Sender's email
        to: process.env.EMAIL_USER,        // Recipient's email (same as sender)
        subject: 'Message from USSD User', // Subject of the email
        text: message                      // Message entered by the user
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error sending email: ${error.message}`);
        } else {
            console.log(`Email sent: ${info.response}`);
        }
    });
};

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post('/ussd', (req, res) => {
    // Read the variables sent via POST from our API
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text,
    } = req.body;

    let response = '';

    // If no input yet, offer "Send Email" option
    if (text === '') {
        // This is the first request. Start the response with CON
        response = `CON Choose an option:
        1. Send Email`;
    } 
    // When the user selects "Send Email"
    else if (text === '1') {
        response = `CON Please enter your message:`;
    } 
    // When the user inputs the message (anything after selecting option 1)
    else if (text.startsWith('1*')) {
        // Extract the message (everything after '1*')
        const userMessage = text.split('*').slice(1).join(' ');

        // Send the email with the user's message
        sendEmail(`Phone Number: ${phoneNumber}\nMessage: ${userMessage}`);

        // Send a terminal response after the email is sent
        response = `END Your message has been sent.`;
    }

    // Send the response back to the API
    res.set('Content-Type: text/plain');
    res.send(response);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
    if (error) {
        console.log(`Error starting the USSD server: ${error.message}`);
    } else {
        console.log(`USSD server started on port ${PORT}`);
    }
});
