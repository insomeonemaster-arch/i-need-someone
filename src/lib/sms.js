const twilio = require('twilio');

let client;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const send = async (to, body) => {
  if (!client) {
    console.log('[SMS SKIPPED - no credentials]', { to, body });
    return;
  }
  return client.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to, body });
};

const sendOtp = (phone, otp) => send(phone, `Your I Need Someone verification code is: ${otp}. Valid for 10 minutes.`);

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { send, sendOtp, generateOtp };
