// checks if box open or closed no authentication no input verification (input box_id)
// returns string ( true(locked), false(unlocked), database error )
function isBoxFull(box_id)
{
    let query = "SELECT ultrasonic FROM BoxOwnership WHERE box_id = ? ";
    let inputVars = [box_id];
    let queryResult;

    // obtain ultrasonic value
    try
    {
        queryResult = con.query(query, inputVars);
        let ultrasonic = queryResult[0].ultrasonic;

        console.log(`ultrasonic value from db: ${ultrasonic}`)
        return ultrasonic;
    } 
    catch (err) 
    {
        console.log(err);
        return "database error";
    }
} 


/*
List of mysql functons that interacts with database

TODO
time check 
hash + salt for passwords # online got a couple libraries for that
-read box state info from mysql
-open box

NOTES::
/OTP works
do hash + salt functions + other interfaces.

!test /register
!test 3 params if breaks things
test /unlock works, implement with cheng ee code
!test /delivery (shld be working)

THINKING
what do we want to have default password be?
do we have case if user leaks their password
implementing security in the QR code

*/
const rp = require('request-promise');
var mysql = require('sync-mysql');
const TELEGRAM_TOKEN = '<token>'; // cheng ee bot token

var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({ endpoint: '<MQTT Endpoint>' });

var con = new mysql({ 
    host: "<db endpoint>",
    user: "<username>",
    password: "<password>",
    database: "<db>"
});

// Hashing
const bcrypt = require('bcryptjs');
const saltRounds = 10;

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

// hash
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

    // 
    let dbPassHashed = queryResult[0].pass;
    // let passHashed = bcrypt.hashSync(pass, saltRounds);

    console.log(`dbPassHashed: ${dbPassHashed}, pass: ${pass}`);

    if (bcrypt.compareSync(pass, dbPassHashed))
    {
        console.log("Password matched")
        return true;
    } else
    {
        return false;
    }
}

// hash
// updates password for specific box_id
// returns TRUE on success, FALSE otherwise
function updatePassword(box_id,newPass)
{
    newPassHashed = bcrypt.hashSync(newPass, saltRounds);

    let query = "UPDATE BoxOwnership SET pass = ? WHERE box_id = ? ";
    let inputVars = [newPassHashed,box_id];
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
            return "Registration Failed"
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
function generateOTP(chat_id) 
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
function saveOTPToDatabase(box_id,OTP,otp_creation_time)
{
    try{
        con.query("UPDATE BoxOwnership SET OTP = ?, otp_creation_time = ? WHERE box_id = ?", [OTP,otp_creation_time,box_id], function (err) {            
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
function OTPCommand(box_id)
{
    let result = generateOTP(box_id);
    let OTP = result.OTP;
    let otp_creation_time = result.creationTime;

    console.log(`OTP is: ${OTP}, otp_creation_time is: ${otp_creation_time}`)

    let res = saveOTPToDatabase(box_id,OTP,otp_creation_time);
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

// Opens box TODO
async function openBox()
{
    console.log("Opening Box");
    await sendToIotCore();
    console.log("Box open MQTT completed");
}

// Opens box TODO
async function closeBox()
{
    console.log("Closing Box");
    await sendToIotCoreclose();
    console.log("Box close MQTT completed");
}

// checks if box open or closed no authentication no input verification (input box_id)
// returns string (true(locked), false(unlocked), error reading database, lock state is null)
function isBoxLocked(box_id)
{

}

// checks OTP valid, by checking OTP and checking Time
// true on OTP correct, reason on failure
function verifyOTP(box_id, OTP)
{
    let query = "SELECT OTP, otp_creation_time FROM BoxOwnership WHERE box_id = ?;";
    let inputVars = [box_id];
    let queryResult;

    try{
        queryResult = con.query(query, inputVars);
    } catch (err) {
        console.log(err);
        throw err;
    }

    let dbOTP = queryResult[0].OTP;
    let dbotp_creation_time = queryResult[0].otp_creation_time;

    console.log(`query result is ${queryResult[0].OTP} ${queryResult[0].otp_creation_time}`);

    console.log(`Current Time: ${Date.now()} Original Time: ${dbotp_creation_time}`);

    let timeAllowance = 1800000 // in ms

    // verify time
    if ( (Date.now() - dbotp_creation_time) > timeAllowance) // more than 30 mins pass
    {
        console.log("OTP expired");
        return "OTP expired"
    } 
    else // OTP time valid
    {
        if (OTP != dbOTP)
        {
            console.log("OTP wrong")
            return "OTP wrong"
        }
        else 
        {
            console.log("OTP Correct")
            return true
        }
    }

}

// Functions to open box
// returns a promise.
async function sendToIotCore() 
{
  console.log("mqtt being sent");

  var params = {
      topic: "topic/hello", // topic/iots
      payload: "hi",
      qos: 1  
  };

  return iotdata.publish(params, function(err, data) {
    if (err) {
        console.log("ERROR => " + JSON.stringify(err));
    }
    else {
        console.log("Success");
    }
  }).promise();

}

async function sendToIotCoreclose() 
{
  console.log("mqtt being sent");

  var params = {
      topic: "topic/hello", // topic/iots
      payload: "bye",
      qos: 1  
  };

  return iotdata.publish(params, function(err, data) {
    if (err) {
        console.log("ERROR => " + JSON.stringify(err));
    }
    else {
        console.log("Success");
    }
  }).promise();

}  
async function sendToIotCorecheck() 
{
  console.log("mqtt being sent");

  var params = {
      topic: "topic/hello", // topic/iots
      payload: "check",
      qos: 1  
  };

  return iotdata.publish(params, function(err, data) {
    if (err) {
        console.log("ERROR => " + JSON.stringify(err));
    }
    else {
        console.log("Success");
    }
  }).promise();

}  

// Function to close box
// sends bye, closes 
async function sendToIotCoreclose() 
{
  console.log("mqtt being sent");

  var params = {
      topic: "topic/hello", // topic/iots
      payload: "bye",
      qos: 1  
  };
  return iotdata.publish(params, function(err, data) 
  {
    if (err) 
    {
        console.log("ERROR => " + JSON.stringify(err));
    }
    else 
    {
        console.log("Success");
    }
  }).promise();
}


module.exports.Mqttiotcores = async event => {
    const body = JSON.parse(event.body);
    const {chat, text} = body.message;

    console.log(`text inputed is: ${text}`)

    let splitText = text.split(" ");
    let command = splitText[0];
    let param1 = splitText[1];
    let param2 = splitText[2];
    let param3 = splitText[3];

    console.log(`inputs are command: ${command} param1: ${param1} param2: ${param2} param3: ${param3}`);

    // have each command do param checking

    // Verify Credentials, Generate OTP, save OTP to DB, return to user
    if (command == '/OTP') 
    {
        let box_id = param1;
        let password = param2;

        if (box_id === undefined || password === undefined) // check not empty
        {
            ans = "params empty"
            await sendToUser(chat.id, ans);
        } 
        else // params not empty 
        {
            let result = verifyPassword(box_id,password);

            if (result == true)
            {
                console.log("Password Correct");
    
                let generated = generateOTP();
                let OTP = generated.OTP;
                let otp_creation_time = generated.creationTime;
    
                console.log(`OTP TIME IS: ${otp_creation_time}`)
                let res = saveOTPToDatabase(box_id,OTP,otp_creation_time);
                
                if (res == false)
                {
                    ans = "Unable to save OTP to database"
                    await sendToUser(chat.id, ans);
                } else
                {
                    ans = `Generated OTP, your OTP is: ${OTP} creation time: ${otp_creation_time}`;
                    await sendToUser(chat.id, ans);
                }
            } 
            else 
            {
                ans = "Unable to verify Credentials";
                await sendToUser(chat.id, ans);
            }
        }
    } 
    else if (command == '/register')
    {
        ans = "/register Command"
        await sendToUser(chat.id,ans);

        let box_id = param1;
        let oldPass = param2;
        let newPass = param3;

        if (box_id === undefined || oldPass === undefined || newPass === undefined) // check not empty
        {
            ans = "params empty"
            await sendToUser(chat.id, ans);
        }
        else
        {
            let result = register(box_id,oldPass,newPass);
            await sendToUser(chat.id,result);
        }
    } 
    else if (command == '/unregister')
    {
        ans = "/unregister Command"
        await sendToUser(chat.id,ans);
    } 
    else if (command == '/unlock')
    {
        ans = "/unlock Command";
        await sendToUser(chat.id,ans);

        let box_id = param1;
        let Pass = param2;

        if (box_id === undefined || Pass === undefined) // check not empty
        {
            ans = "params empty";
            await sendToUser(chat.id, ans);
        }
        else
        {
            let verified = verifyPassword()
            if (verified)
            {
                openBox();
                ans = "Opening Box";
                await sendToUser(chat.id,ans);
            } 
            else 
            {
                ans = "verification Failed";
                await sendToUser(chat.id,ans);
            }
        }
    }
    else if (command == '/lock')
    {
        ans = "/lock Command";
        await sendToUser(chat.id,ans);

        let box_id = param1;
        let Pass = param2;

        if (box_id === undefined || Pass === undefined) // check not empty
        {
            ans = "params empty";
            await sendToUser(chat.id, ans);
        }
        else
        {
            let verified = verifyPassword()
            if (verified)
            {
                sendToIotCoreclose();
                ans = "locking Box";
                await sendToUser(chat.id,ans);
            } 
            else 
            {
                ans = "verification Failed";
                await sendToUser(chat.id,ans);
            }
        }
    }
    else if (command == '/unlockotp')
    {
        let box_id = param1;
        let OTP = param2;

        if ( box_id === undefined || OTP === undefined) // check not empty
        {
            ans = "params empty";
            await sendToUser(chat.id, ans);
        } 
        else // not empty 
        {
            let verified = verifyOTP(box_id, OTP)
            // console.log(`verified is ${verified}`)
            if (verified == true)
            {
                console.log("verified");
                openBox();
                await sendToUser(chat.id, "verified, opening box");
            } 
            else 
            {
                console.log(verified);
                await sendToUser(chat.id, verified);
            }
        }
    }
    else if (command == '/check')
    {
        ans = "/check Command"
        sendToIotCorecheck();
        await sendToUser(chat.id,ans);

        // check ultrasonic value of box_id = 1
        let result = isBoxFull(1)
        if (result == true)
        {
            console.log(`Your box has item`);
            ans = "Box is filled";
            await sendToUser(chat.id,ans);
        } 
        else if (result == false)
        {
            console.log(`Your box has no items`);
            ans = "Box is empty";
            await sendToUser(chat.id,ans);
        }
        else
        {
            console.log(`Error reading db`);
            ans = "Error Reading db";
            await sendToUser(chat.id,ans);
        }
    }
    else if (command == '/delivery')
    {
        ans = "/delivery Command <delivery> <box> <staff>";
        await sendToUser(chat.id,ans);

        let delivery_id = param1;
        let box_id = param2;
        let staff_id = param3;

        if (delivery_id === undefined || box_id === undefined || staff_id === undefined) // check not empty
        {
            ans = "params empty";
            await sendToUser(chat.id, ans);
        } 
        else // not empty 
        {
            resultMessage = verifyDelivery(delivery_id, box_id, staff_id);
            await sendToUser(chat.id, resultMessage);
        }
    }  
    else
    {
        ans = "Unknown Command"
        await sendToUser(chat.id,ans);
    }
    

    return { statusCode: 200 }; // everything should end up here
};

/* User Manual 

/OTP box_id password

/register box_id oldPass newPass 

/unlock box_id pass

/unlockotp box_id otp

/delivery delivery_id box_id staff_id 


*/