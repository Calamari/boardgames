# Boardgames

## Installation and starting

Install `mongodb`.

Start mongodb like that:

~~~ bash
cd /boardgames/directory
mongod --dbpath=./db
~~~

start the node server:

~~~ bash
node server.js --port 8125
~~~

or use simply use [foreman](https://github.com/ddollar/foreman)

~~~ bash
foreman start
~~~

## Syncinc to server

Call from the root directory

~~~ bash
./script/sync.sh
~~~

## Restarting the server

~~~ bash
sudo /etc/init.d/boardgames start
~~~

## So the games can restart

~~~ bash
sudo update-rc.d boardgames defaults
~~~
