/*
List of mysql functons that interacts with database

TODO
time check + saving current time in db
hash + salt for passwords # online got a couple libraries for that

leave OTP create to jia nan

THINKING
what do we want to have default password be?
do we have case if user leaks their password
implementing security in the QR code

*/
const rp = require('request-promise');
var mysql = require('sync-mysql');
// const { try } = require('bluebird');
const TELEGRAM_TOKEN = '1009090418:AAHVBeQ5EeeDWwUVox8_G2RjP61VBE53bn8';

var conn = new mysql({ 
    host: "databaseiots.cjthjauaprsn.us-east-1.rds.amazonaws.com",
    user: "adminIOTS",
    password: "masterpasswordIOTS",
    database: "db"
});

// prints entire contents of table CurrentDeliveries, returns result(JSON of entire table) {result[0].box_id}
function selectAllCurrentDeliveries()
{
    let query = "SELECT * FROM CurrentDeliveries"

    try{
        const queryResult = con.query(query)
    } catch (err)
    {
        console.log(err);
    }
    
    console.log(`Result from selecting all deliveries: ${result[0].delivery_id}`)
    return queryResult;
}

// verify that delivery is geniune, checks box_id,staff_id and delivery_id. if verified, updates state of database 
// search by delivery_id, then verify box_id and staff_id is true, update stat
function verifyDelivery(delivery_id, box_id, staff_id)
{
    // Verify inputs arent empty
    if (delivery_id == null || box_id == null || staff_id == null)
    {
        console.log(`delivery_id: ${delivery_id} box_id: ${box_id} staff_id: ${staff_id}`);
        return "Parameters are empty"
    }

    let query = "SELECT * FROM CurrentDeliveries WHERE delivery_id = ? "
    let inputVars = [delivery_id];
    let queryResult = null;

    try{
        queryResult = con.query(query,inputVars);
    } catch (err)
    {
        console.log(err);
        return "Error reading database"
    }

    //console.log(queryResult['0'].box_id);
    //console.log(queryResult['0'].staff_id);

    // Verify box_id and staff_id correct
    if (queryResult['0'].box_id == box_id)
    {
        if(queryResult['0'].staff_id == staff_id)
        {
            // Update database
            console.log("Delivery Verified, updating state");
            let query = "UPDATE CurrentDeliveries SET state = 'Delivered' WHERE delivery_id = ? "
            let inputVars = [delivery_id];
            try{
                const queryResult = con.query(query,inputVars);
            } catch (err)
            {
                console.log(err);
                return "Error updating state of database"
            }

            return "Delivery Verified and database updated";

        } else {
            console.log("Staff id does not match");
            return "Parameters incorrect";
        }

    } else {
        console.log("Box id does not match");
        return "Parameters incorrect";
    }
}

// Verify Password is correct for specific box_id
// returns TRUE on success, FALSE otherwise
function verifyPassword(box_id,pass)
{
    // Verify inputs arent empty
    if (box_id == null || pass == null)
    {
        console.log(`box_id: ${box_id} pass: ${pass}`);
        console.log("paramters are empty");
        return "Parameters are empty";
    }

    let query = "SELECT pass FROM BoxOwnership WHERE box_id = ?;";
    let inputVars = [box_id];
    let queryResult;

    // TODO, hash+salt password
    // let pass;

    // obtain password of specific box
    try{
        queryResult = con.query(query, inputVars);
    } catch (err) {
        console.log(err);
        throw err;
    }

    console.log(`query result is ${queryResult[0].pass}`);

    if (pass == queryResult[0].pass)
    {
        console.log("Password matched")
        return true;
    } else
    {
        return false;
    }
}

// updates password for specific box_id
// returns TRUE on success, FALSE otherwise
function updatePassword(box_id,newPass)
{
    let query = "UPDATE BoxOwnership SET pass = ? WHERE box_id = ? ";
    let inputVars = [newPass,box_id];
    let queryResult;

    // obtain password of specific box
    try{
        queryResult = con.query(query, inputVars);
    } catch (err) {
        console.log(err);
        return false;
    }
    return true;
}

// check old pass correct for spcific box_id, then updates with new pass
// returns string showing result
function register(box_id, oldPass, newPass)
{
    let result = verifyPassword(box_id,oldPass);
    if (result == true)
    {
        console.log("Password Correct");
        try{
            updatePassword(box_id,newPass);
            return "Registered Sucessfully"
        } catch (err)
        {
            console.log(err);
        }

        
    }
    else{
        return "Registration failed, please re-try"
    }
}

// Removes Pass, salt, contact_number of specifc box_id, setting them to NULL, but set Pass to "default"
// returns FALSE on fail, TRUE on success
function removeOwnership(box_id)
{
    let query = "UPDATE BoxOwnership SET pass = NULL, salt = NULL, contact_number = NULL, OTP = NULL, otp_creation_time = NULL WHERE box_id = ? ";
    let inputVars = [box_id];
    let queryResult;

    // obtain password of specific box
    try{
        queryResult = con.query(query, inputVars);
    } catch (err) {
        console.log(err);
        return false;
    }
    return true;
}

// unregister by removeownership, verifying current password correct
function unregister(box_id, currentPass)
{
    verifyPassword(box_id,currentPass);
    if(!verifyPassword)
    {
        return "Authentication failed";
    } else {
        removeOwnership(box_id);
        return "Success"
    }
    
}

// Generate OTP of pre-defined length
// result.OTP -> otp generated
function generateOTP(chat_id,text) 
{
  OTPlength = 7;

  var result = {
    OTP: "",
    creationTime: -1,
    chat_id
  }
  var possibleChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 

  for (let i = 0; i < OTPlength; i++ ) 
  { 
      result.OTP += possibleChars[Math.floor(Math.random() * possibleChars.length)]; 
  } 

  result.creationTime = Date.now();
  result.chat_id=chat_id
  return result;
}

// saves OTP into database
// returns TRUE on success, FALSE on error
function saveOTPToDatabase(box_id,OTP)
{
    try{
        con.query("UPDATE BoxOwnership SET OTP = ? WHERE box_id = ?", [OTP,box_id], function (err) {            
        });
        return true;
    } catch (err)
    {
        console.log(err);
        return false;
    }
}

// generates OTP and updates database, returns OTP to user
// returns false on failure, OTP on success
function OTPCommand()
{
    let result = generateOTP(text);
    let OTP = result.OTP;

    let res = saveOTPToDatabase()
    if (res == true)
    {
        return OTP
    } else {
        return false;
    }

}

async function sendToUser(chat_id, text) {
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

module.exports.lagibagus = async event => {
    const body = JSON.parse(event.body);
    const {chat, text} = body.message;

    console.log(`text inputed is: ${text}`)

    let splitText = text.split(" ");
    let command = splitText[0];
    let param1 = splitText[1];
    let param2 = splitText[2];

    console.log(`inputs are command: ${command} param1: ${param1} param2: ${param2}`);

    // have each command do param checking

    // Verify Credentials, Generate OTP, save OTP to DB, return to user
    if (command == '/OTP') 
    {
        let box_id = param1;
        let password = param2;

        if (box_id === undefined || password === undefined) // check not empty
        {
            ans = "params empty"
            return await sendToUser(chat.id, ans);
        }

        let result = verifyPassword(box_id,password);

        if (result == true)
        {
            console.log("Password Correct");

            let generated = generateOTP();
            let OTP = generated.OTP;

            let res = saveOTPToDatabase(box_id,OTP);
            
            if (res == false)
            {
                ans = "Unable to save OTP to database"
                await sendToUser(chat.id, ans);
            } else
            {
                ans = `Generated OTP, your OTP is: ${OTP}`;
                await sendToUser(chat.id, ans);
            }
        } else {
            ans = "Unable to verify Credentials";
            await sendToUser(chat.id, ans);
        }


    } 
    else if (command == '/register')
    {
        ans = "/register Command"
        await sendToUser(chat.id,ans);
    } 
    else if (command == '/unregister')
    {
        ans = "/unregister Command"
        await sendToUser(chat.id,ans);
    } 
    else if (command == '/unlock')
    {
        ans = "/unlock Command"
        await sendToUser(chat.id,ans);
    }
    else if (command == '/check')
    {
        ans = "/check Command"
        await sendToUser(chat.id,ans);
    }  
    else
    {
        ans = "Unknown Command"
        await sendToUser(chat.id,ans);
    }
    

    return { statusCode: 200 };
};
