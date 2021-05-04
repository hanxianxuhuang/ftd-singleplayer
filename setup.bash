#!/bin/bash

rm package*
npm init -y

npm install express
npm install pg

psql "dbname='webdb' user='webdbuser' password='password' host='localhost'" -f db/schema.sql

nodejs ftd.js
