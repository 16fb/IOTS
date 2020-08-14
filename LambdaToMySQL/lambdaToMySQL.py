from __future__ import print_function
  
import json
import boto3
import pymysql

#Configuration Values
endpoint = ''
username = ''
password = ''
database_name = ''

#Connection
connection = pymysql.connect(endpoint, user=username,
passwd=password, db=database_name)
    
def lambda_handler(event, context):

    # Parse the JSON message 
    eventText = json.dumps(event)
    state = 0

    print("event text is: ")
    print(eventText)
    val = (eventText)
    
  

    try:
        # variables must be enclosed in single quotes apparently.
        query = "UPDATE BoxOwnership SET ultrasonic = %s WHERE box_id = 1"  #.format(client_name,reason,creation_date) 

        cursor = connection.cursor()
        cursor.execute(query,val)

        print("query executed")
        
        # accept changes
        connection.commit()   

    finally:
        print("function completed")


#lambda_handler(1,1)