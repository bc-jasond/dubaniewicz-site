#!/bin/bash
# Docker
# uninstall old versions of docker
sudo apt-get remove docker docker.io containerd runc ;
sudo apt-get update;
# Install packages to allow apt to use a repository over HTTPS:
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common;
# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - ;
# TODO: verify fingerprint
sudo apt-key fingerprint 0EBFCD88 ;
# Add Docker repository
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   edge";
# update
sudo apt-get update ;
# install Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io ;


# install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose ;



# install Dropbox
cd ~ && wget -O - "https://www.dropbox.com/download?plat=lnx.x86_64" | tar xzf - ;

# open firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Certbot / Let's Encrypt
sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot python-certbot-nginx