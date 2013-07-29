# Boardgames

## Installation and starting

Install `mongodb`.

Start mongodb like that:

~~~ bash
cd /boardgames/directory
mongod --dbpath=./db
~~~

or use simply use [foreman](https://github.com/ddollar/foreman)

~~~ bash
foreman start
~~~

start the node server:

~~~ bash
node server.js --port 8125
~~~
