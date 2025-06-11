const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Nodemailer Transporter Config:');
console.log('  Service:', process.env.EMAIL_SERVICE);
console.log('  User:', process.env.EMAIL_USER ? 'Loaded' : 'Not Loaded');
console.log('  Pass:', process.env.EMAIL_PASS ? 'Loaded' : 'Not Loaded');

module.exports = transporter;