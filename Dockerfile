#Create from latest LTS
FROM node:carbon

MAINTAINER Alexander Zeller

#Create a new directory to run our app.
RUN mkdir -p /usr/src/app

#Set the new directory as our working directory
WORKDIR /usr/src/app

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app

#Copy all the content to the working directory
COPY . /usr/src/app

#Expose Port
EXPOSE 9000

#Run the application.
CMD [ "npm", "start" ]