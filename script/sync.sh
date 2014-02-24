#! /bin/bash
rsync -rv --exclude tmp/ --exclude .git/ --exclude db/ --exclude node_modules/ --exclude log/ . calamari@boardgames.jaz-lounge.com:/var/www/boardgames
ssh boardgames.jaz-lounge.com 'cd /var/www/boardgames && npm install'
ssh -t boardgames.jaz-lounge.com 'sudo restart boardgames'
