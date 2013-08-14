#! /bin/bash
rsync -rv --exclude tmp/ --exclude .git/ --exclude db/ --exclude node_modules/ --exclude log/ . calamari@boardgames.jaz-lounge.com:/var/www/boardgames