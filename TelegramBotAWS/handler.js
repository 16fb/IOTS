const rp = require('request-promise');
const TELEGRAM_TOKEN = '1009090418:AAHVBeQ5EeeDWwUVox8_G2RjP61VBE53bn8';

async function getShortUrl(longUrl) 
{
  const options = {
    method: 'POST',
    uri: 'https://cleanuri.com/api/v1/shorten',
    form: {
      url: String(longUrl).trim()
    },
    json: true
  };

  return rp(options);
}

async function sendToUser(chat_id, text) 
{
  const options = {
    method: 'GET',
    uri: `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    qs: {
      chat_id,
      text
    }
  };

  return rp(options);
}


// generate alphanumeric with caps OTP of specific length, also generates current date
function generateOTP(chatId, text, OTPlength) 
{
  OTPlength = 6;

  var result = {
    OTP: "",
    creationTime: -1,
    chatId: -1
  };

  var possibleChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 

  for (let i = 0; i < OTPlength; i++ ) 
  { 
      result.OTP += possibleChars[Math.floor(Math.random() * possibleChars.length)]; 
  } 


  result.chatId = chatId;
  result.creationTime = Date.now();

  return result;
}




// Telegram API stuff
/*
body.message.text
body.message.chat
body.message.chat.id

stuff is all JSON
*/

// Called when webhook receives JSOn from telegram
module.exports.lagibagus = async event => 
{
  const body = JSON.parse(event.body);
  const {chat, text} = body.message;

  if (text) 
  {
    let message = '';

    if (text == 'OTP')
    {
      try
      {
        const result = generateOTP(chat.id, text);
        message = `Input: ${text}, \nResult OTP: ${result.OTP}, \nCreation Time: ${result.creationTime} \ncharID: ${result.chatId}`;
      } 
      catch (error)
      {
        message = `Input: ${text}, \nError: ${error.message}`;
      }
      await sendToUser(chat.id, message);
    }
    // random text
    else if (text)
    {
      try 
      {
        const result = await getShortUrl(text);
        message = `Input: ${text}, \nShort: ${result.result_url}`;
      } 
      catch (error) 
      {
        message = `Input: ${text}, \nError: ${error.message}`;
      }

      await sendToUser(chat.id, message);
    }
  } 
  else 
  {
    await sendToUser(chat.id, 'Text message is expected.');
  }

  
  
  return { statusCode: 200 };
};