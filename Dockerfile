FROM alpine

ARG server_port
ENV SERVER_PORT 3000

RUN apk add --update npm

WORKDIR /websocket-server
COPY package.json /websocket-server/package.json
RUN npm install 

COPY . /websocket-server

EXPOSE 3000

CMD ["npm", "start"]