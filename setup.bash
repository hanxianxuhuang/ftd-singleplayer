#!/bin/bash

rm package*
npm init -y

npm install express --silent
npm install pg --silent

psql "dbname='webdb' user='webdbuser' password='password' host='localhost'" -f db/schema.sql

nodejs ftd.js
