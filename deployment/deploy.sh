# need libe-office
# https://www.libreoffice.org/download/download/
sudo apt install libreoffice

# need imagemagick
sudo apt install imagemagick

sudo npm i -g pm2;
pm2 startup systemd;


# REF - https://medium.com/@brunoeleodoro96/get-ssl-certificate-for-aws-ec2-nodejs-app-6ceed6486867
mkdir secrets;
cd secrets;
openssl genrsa -out server-key.pem 1024;
openssl req -new -key server-key.pem -out server-csr.pem;
openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem;

# start app
pm2 start yarn --interpreter bash --name 'telegram-server' -- start:prod