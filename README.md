# ftd-singleplayer
A singleplayer shooting game 

## [Multiplayer Version](https://github.com/hanxianxuhuang/ftd-multiplayer)

## Tools
JavaScript, jQuery, HTML, CSS, PostgreSQL, Restful API, Node.js, Express.js, Ajax and Middleware

## Setup

### VM
[A Ubuntu Server](https://ubuntu.com/download/server/step2) (others may also work) that has network connection configured to either Bridged or NAT

### Installing required packages
```
sudo apt install nodejs 
sudo apt install npm 
sudo apt install postgresql
```

### Setting up PostgreSQL
```
sudo -u postgres createuser webdbuser
sudo -u postgres psql

ALTER USER webdbuser WITH ENCRYPTED PASSWORD 'password';
CREATE DATABASE webdb;
GRANT ALL PRIVILEGES ON DATABASE webdb TO webdbuser;
EXIT
```

## Usage
1. cd into the directory
2. ``` chmod +x setup.bash && ./setup.bash```
3. Visit IP_ADDRESS:8000 in browser (use "ip a" to determine IP_ADDRESS)
