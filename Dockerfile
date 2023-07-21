FROM node:18.16.1-alpine as node

WORKDIR /usr/src/app

# Files required by npm install
COPY package*.json ./
# Files required by prisma
COPY prisma ./prisma

RUN npm ci

COPY . .

# Copy Prisma client
COPY /usr/src/node_modules/.prisma ./node_modules/.prisma

EXPOSE 25565

CMD [ "npm", "start" ]
