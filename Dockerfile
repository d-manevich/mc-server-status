FROM node:18.16.1-alpine as node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 25565

CMD [ "npm", "start" ]
