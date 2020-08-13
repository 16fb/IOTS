# IOTS ET0731 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;[Security](Security.md) &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;[Improvments](Improvement.md)
# Introduction
During this special period of time, most of us will be in favour of not having close contact with strangers. For students and working adults, we sometimes will encounter times when the parcel arrives and we are unable to present at the point of time.This has caused our parcels to be left at the doorstep or kept in the riser, leaving them at risk of being stolen.

It also leads to a waste of resources and time as the delivery man has to come again another day.How can we allow the delivery man to deliver the parcel to the user safely and easily without it costing too much and downloading an additional app.

IOTS repo for telegram bot hosted on aws lambda controlling a vault locking system
## About The Team
* ***Bryan Wong***
* ***Lim Cheng Ee***
* ***Chen XinHu***
* ***Jia Nan***
## Infrastructure
### User-Service FLow Diagram
<img src="Networkflow.PNG" alt="diagram picture">

The Whole flow of Safe Vault Process:

  * The vault comes with a owner ID and a default Password -> the user/subscriber of service would need to change to the default password
    for stronger user authentication.
  * At each delivery, out collaboration company will update the database with respective delivery ID and Parcel No. to the matching Box ID
  * When the courier reaches the door step, He then will need to key in the Box ID, Parcerl No. along with his staff ID in order to verify himself.
  
### Electronic Components Connection
<img src="Electronic Parts Connection.jpg" alt="connection picture">

### Time Diagram
<img src="TimeDiagram.jpg" alt="Time picture">



## TelegramBot Commands
 1. **/Register**
 Register the user to the bot using the box id and default password that is given to the user when the user rent out the box
 2. **/Unregister**
 3. **/Unlock**
 4. **/OTP**
 5. **/UnlockOTP**
 
 TR64 Compliance check
### Dread risk assessment
|                            | DREAD RISK       |                 |                |                |                |              |
| -------------------------- | ---------------- | --------------- | -------------- | -------------- | -------------- | ------------ |
| Attack                     | Damage Potential | Reproducibility | Exploitability | Affected Users | Discoverablity | Risk (MAX=5) |
| Spoofing                   |                  |                 |                |                |                |              |
| WiFi access                | 3                | 5               | 4              | 2              | 2              | 3.2          |
| Unauth connection (stolen) | 4                | 4               | 1              | 3              | 1              | 2.6          |
| Cloning of hardware        | 2                | 4               | 4              | 2              | 4              | 3.2          |
| Session hijack             | 4                | 1               | 3              | 1              | 3              | 2.4          |
| Physical                   | 2                | 1               | 3              | 1              | 1              | 1.6          |
| RF jamming                 | 4                | 4               | 4              | 2              | 1              | 3            |
| Hardware Error             | 3                | 1               | 1              | 1              | 1              | 1.4          |
| Man in the middle          | 5                | 2               | 4              | 1              | 5              | 3.4          |
| Modified data              | 5                | 2               | 5              | 1              | 4              | 3.4          |
| Door data leak             | 4                | 3               | 4              | 2              | 5              | 3.6          |
| UUID Leak                  | 5                | 1               | 4              | 2              | 5              | 3.4          |
| User ID Leak               | 4                | 1               | 4              | 4              | 3              | 3.2          |
| Flooding                   | 5                | 5               | 4              | 4              | 1              | 3.8          |
| Redirect notification      | 4                | 1               | 3              | 1              | 1              | 2            |
| Botnet inclusion           | 3                | 1               | 2              | 1              | 5              | 2.4          |
| Cryptojacking              | x                | x               | x              | x              | x              | x         |

### TR64 Checklist

| Attack       | Checklist                                                                                                                                   | TR64 Code                                 | Description                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ESP32        | Tamper-proof Enclosure, No exposed joints/connectors to open device, Secure Communications                                                  | AP-04 AP-03 RS-03                         | Enclosure is not easily tampered with, Exposed ports are sealed off, ESP32 uses MQTTS                                 |
| Telegram API | Client is identified with an unique Owner ID, users are identified by unique Credentials        | FP-01 FP-03 IA-02 AP-02                   | Secure transmission of JSON through HTTPS with encryption. OTP generated from user request of the bot to AWS, Secure Communications |
| AWS system   | Unique non-modifiable IDs. passwordss are hashed with salt. Identify and analyse threats.  Data is stored in AWS RDS, Secure Communications | IA-03<br>IA-01<br>CS-01<br>DP-03<br>RS-03 | Secure unique ids created upon device manufacture, salt generated alongside creation    

DDos on telegram bot
 
