# Importing random to generate  
# random string sequence  
import random  
     
# Importing string library function  
import string  
     
def generateOTP(size):  
         
    # Takes random choices from  
    # ascii_letters and digits  
    generate_pass = ''.join([random.choice( string.ascii_uppercase +
                                            string.ascii_lowercase +
                                            string.digits)  
                                            for n in range(size)])  
                             
    return generate_pass  
     
# Driver Code   
password = generateOTP(6)  
print(password)  








#// generate alphanumeric with caps OTP of specific length, also generates current date
#function generateOTP(chatId, text, OTPlength) 
#{
#  OTPlength = 6;
#
#  var result = {
#    OTP: "",
#    creationTime: -1,
#    chatId: -1
# };
#
#  var possibleChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
#
#  for (let i = 0; i < OTPlength; i++ ) 
#  { 
#      result.OTP += possibleChars[Math.floor(Math.random() * possibleChars.length)]; 
#  } 
#
#
#  result.chatId = chatId;
#  result.creationTime = Date.now();#
#
#  return result;
#}