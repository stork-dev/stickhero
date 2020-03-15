#Base Image
FROM ubuntu:16.04

#Author
MAINTAINER vikas

# install apache
RUN apt-get update
RUN apt-get install -y apache2

# user code
ADD stickhero /var/www/html/
 
#Expose Apache
EXPOSE 80
# Container boots
ENTRYPOINT /usr/sbin/apache2ctl -D FOREGROUND
