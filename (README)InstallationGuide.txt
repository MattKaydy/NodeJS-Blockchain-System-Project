OVERVIEW:
The following briefs on how to launch the Blockhain Prototype program, in command line interface, with Windows Powershell or Windows Command Prompt.

REQUIREMENTS:
- Node.JS 18.12.1 or above
- NPM package installer
- MongoDB Community Server 6.0.3 or above
You can install NPM and Node.JS in a bundle here (download 18.12.1 LTS):
https://nodejs.org/en/
MongoDB can be installed here:
https://www.mongodb.com/try/download/community

INSTALLATION GUIDE (For Windows):
[INSTALLING PACKAGES]
1. 
Checkout this repo with Git Checkout.

2. 
Open Windows Command Prompt or Windows PowerShell, cd the directory to the NodeJS-Blockchain-System Folder.

For example, if the directory is C:/NodeJS-Blockchain-System, then type the command "cd C:/NodeJS-Blockchain-System"

3.
Install the packages needed by running the command "npm install"

[SETTING UP MONGODB]
4.
Make sure MongoDB is installed, launch MongoDB Compass

5.
Create a new connection in Connect -> New Connection (ctrl+N), in the URI, make sure the connection string is "mongodb://localhost:27017". Click save and connect afterwards. DO NOT CLOSE MongoDBCompass.

[LAUNCHING THE PROGRAM]
6.
Launch the program by command "node main".

7.
Select User 1 or User 2. IMPORTANT: The port for user 1 is localhost:1111 and for user 2 is localhost:2222. MAKE SURE there are no other software that is using this pot!

8.
The program is successfully launched and you should be able to see the main menu.