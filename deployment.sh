# install nginx
sudo apt-get update && sudo apt-get install nginx

sudo ufw app list
# should get the following applications
   # Nginx Full
   # Nginx HTTP
   # Nginx HTTPS
   # OpenSSH

sudo ufw allow 'Nginx HTTP'
sudo ufw status # should get 'Nginx HTTP' in the output

#check nginx server status
systemctl status nginx

# install npm and build-essential
sudo apt-get install build-essential

# install cert bot
sudo add-apt-repository ppa:certbot/certbot
sudo apt install python3-certbot-nginx

# install pm2
npm i -g pm2

# start pm2
pm2 start yarn --interpreter bash --name api -- start
