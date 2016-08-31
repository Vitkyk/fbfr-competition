/*-------------For Ubuntu 14.04---------------*/
Step 1: Copy folder ''
Step 2: Install Node.js

sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

Step 3: Install PostgrSQL

sudo apt-get update
sudo apt-get install postgresql

Step 4: Setting PostgreSQL

sudo -u postgres psql
CREATE DATABASE '';
CREATE USER admin WITH password 'admin';
GRANT ALL privileges ON DATABASE '' TO admin;

Step 5: Start server.js

cd PATH/'' /*where PATH - way to copying folder*/
node server.js

Step 6: Connect to server
/*In browser*/
IP:3000/server /*for admin*/
IP:3000/judge /*for judjes*/


