 #include "secrets.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include <Servo.h>

// The MQTT topics that this device should publish/subscribe
#define AWS_IOT_PUBLISH_TOPIC   "topic/hello"
#define AWS_IOT_SUBSCRIBE_TOPIC "topic/hello"
  
WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(256);
Servo myservo;
int pos = 0; 
int door =0;
const int trigPin = 2;
const int echoPin = 5;
const int sensor=34;

int lightInit;  // initial value
int lightVal;   // light reading
// defines variables
long duration;


void openDoor(){
    myservo.attach(13);

  myservo.write(90);               // waits 15ms for the servo to reach the position
  delay(1000); 
  myservo.detach();
  door = 1; 
    delay(1000);//change the status to 1  as lock opened
}
void closeDoor(){
  delay(1000);
  myservo.attach(13);
  myservo.write(0);
  delay(400); 
  myservo.detach();
  door = 0;                          // change the status to 0 as lock opened
}
void connectAWS()
{
  // Connect to wifi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(";-;");
  }

  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.begin(AWS_IOT_ENDPOINT, 8883, net);

  // Create a message handler
  client.onMessage(messageHandler);

  Serial.print("Connecting to AWS IOT");

  while (!client.connect(THINGNAME)) {
    Serial.print(";_;");
    delay(100);
  }

  if(!client.connected()){
    Serial.println("AWS IoT Timeout!");
    return;
  }

  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);

  Serial.println("AWS IoT Connected!");
  
}
void publishMessage()
{
 
  digitalWrite(trigPin, LOW);
delayMicroseconds(2);

// Sets the trigPin on HIGH state for 10 micro seconds
digitalWrite(trigPin, HIGH);
delayMicroseconds(10);
digitalWrite(trigPin, LOW);

// Reads the echoPin, returns the sound wave travel time in microseconds
duration = pulseIn(echoPin, HIGH);

// Calculating the distance
int distance= duration*0.034/2;

// Prints the distance on the Serial Monitor
//Serial.print("Distance: ");
//Serial.println(distance);


  Serial.println(distance);
  if(distance ==10 || distance==11)
 { StaticJsonDocument<200> doc;
  doc["Box is in"] = 0;
  char jsonBuffer[512];
 //serializeJson(, jsonBuffer); // print to client}
  client.publish(AWS_IOT_PUBLISH_TOPIC, "0");
  Serial.println("publishing to topic");}
  else{
    StaticJsonDocument<200> doc;
  doc["Box is in"] = 1;
  char jsonBuffer[512];
 serializeJson(doc, jsonBuffer); // print to client}
  client.publish(AWS_IOT_PUBLISH_TOPIC,"1");
  Serial.println("publishing to topic");
      
  }
  
  }
  /*else{
     StaticJsonDocument<200> doc;
  doc["Box is not in"] = 0;
  char jsonBuffer[512];
 serializeJson(doc, jsonBuffer); // print to client
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
  Serial.println("publishing to topic");
    }*/
  
 
 

/*  if(distance>20){
  StaticJsonDocument<200> doc;
  doc["Box is in"] = 1;
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer); // print to client
  
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
  Serial.println("publishing to topic");
  }
  */



void messageHandler(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);
  Serial.println(payload);
  if(payload=="hi")
  {
     if (door==0){                  // if lock is closed then unlock ,otherwise no movement
      openDoor();
    }
  }
 
  else if(payload=="check"){
    publishMessage();
    
  }
  else
    Serial.println("error");
  
  }

void LDR(){
  int light=analogRead(sensor);
 if(light<3000){
  if(door==1)
  {  closeDoor();
  
 }
  
}
}

void setup() {
  Serial.begin(9600);
   myservo.attach(13);             //setup the Input pin for servo here
   
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
pinMode(echoPin, INPUT);
  connectAWS();
}

void loop() {
//  ultrasonic();
  LDR();
  client.loop();
  delay(100);
    
}
