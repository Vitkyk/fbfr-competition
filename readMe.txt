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

Step 5: Setting IP

sudo ifconfig ETH 192.168.1.42 netmask 255.255.255.0 up /*where ETH - your interface*/

Step 6: Start server.js

cd PATH/'' /*where PATH - way to copying folder*/
node server.js

Step 7: Connect to server
/*In browser*/
192.168.1.42:3000/server /*for admin*/
192.168.1.42:3000/judge /*for judjes*/


