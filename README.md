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
sudo apt install nodejs npm postgresql
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

### Setting up and starting the server
```
# cd into the directory
chmod +x setup.bash && ./setup.bash
```

## Usage
- ```nodejs ftd.js``` if the server has not started
- Visit IP_ADDRESS:8000 in browser (use ```ip a``` to determine IP_ADDRESS)
