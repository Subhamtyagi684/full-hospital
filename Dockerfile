FROM node:18.9-alpine
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm install
EXPOSE 3000
COPY . .
CMD [ "npm", "run", "start" ]
