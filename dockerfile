FROM node:16

RUN apt-get update
RUN apt install nano

RUN mkdir /code
WORKDIR /code
COPY . /code/

RUN npm install -g @angular/cli

RUN npm install 

