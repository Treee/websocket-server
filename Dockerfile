FROM alpine

ARG server_port
ENV SERVER_PORT ${server_port}

RUN apk add --update npm

WORKDIR /aoe-websocket-server
COPY package.json /websocket-server/package.json
RUN npm install 

COPY . /websocket-server
RUN npm run build

EXPOSE ${server_port}

CMD ["npm", "start"]