import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";
import { SocketEnums } from "./common/common-data.js";

export default class MyWebSocketServer {
  _adminSocket;
  _clients;
  _socketPort;
  _isDebug = true;
  constructor() {
    this._clients = [];

    const serverOptions = this.buildServerOptions();
    this._adminSocket = new WebSocketServer(serverOptions);

    process.on("SIGHUP", () => {
      this._adminSocket.close();
      console.log("SIGHUP ERROR:: CLOSING CLIENT");
      process.exit();
    });
  }
  buildServerOptions() {
    if (process.env.SERVER_PORT === undefined) {
      this._socketPort = 8443;
    } else {
      this._socketPort = parseInt(process.env.SERVER_PORT);
    }
    return {
      port: this._socketPort,
    };
  }
  startServer() {
    this._adminSocket.on("connection", this.onClientConnection.bind(this));
    console.log(`Listening on port: ${this._socketPort}`);
  }
  onClientConnection(ws) {
    const uuid = this.sendRegistrationToClient(ws);
    ws.on("close", (error) => {
      if (error) {
        console.log(error);
      }
      this.removeWebsocket(uuid);
    });
    ws.on("error", () => {
      console.log(error);
    });
    ws.on("message", (message) => {
      // console.log("server receives message: " + message);
      const msg = JSON.parse(message);
      console.log("Parsed MEssage: " + msg);
      const applicableWebsockets = this.getApplicableWebsockets(msg.toClientId);
      if (msg.type === SocketEnums.ClientRegister) {
        this.registerWebsocket(uuid, msg.data, ws);
      } else if (msg.type === SocketEnums.PING) {
        applicableWebsockets.forEach((websocket) => {
          websocket.socket.send(JSON.stringify({ type: "PONG", data: "PONG" }));
        });
      } else if (applicableWebsockets.length > 0) {
        if (this.isValidWebsocketMessageType(msg.type)) {
          applicableWebsockets.forEach((websocket) => {
            websocket.socket.send(this.formatDataForWebsocket(msg.type, msg.data));
          });
        }
      }
    });
  }
  getApplicableWebsockets(clientId) {
    const foundWebsockets = this._clients.filter((socket) => {
      return socket.id === clientId;
    });
    return foundWebsockets;
  }
  formatDataForWebsocket(dataType, rawData) {
    if (SocketEnums[dataType] !== "PING") {
      console.log(`DataType: ${dataType} / RawData: ${JSON.stringify(rawData)}`);
    }
    return JSON.stringify({ type: dataType, data: rawData });
  }
  sendRegistrationToClient(websocket) {
    const uuid = randomUUID();
    console.log(`Sending client registration to user: ${uuid}`);
    websocket.send(this.formatDataForWebsocket(SocketEnums.ClientRegister, uuid));
    return uuid;
  }
  registerWebsocket(uniqueId, clientId, websocket) {
    console.log(`Adding client ${clientId} with UIID ${uniqueId}`);
    this._clients.push({ uuid: uniqueId, id: clientId, socket: websocket });
  }
  removeWebsocket(uniqueId) {
    console.log(`Removeing client with UIID ${uniqueId}`);
    this._clients = this._clients.filter((sockets) => {
      return sockets.uuid !== uniqueId;
    });
  }
  isValidWebsocketMessageType(messageType) {
    if (SocketEnums[messageType] === undefined) {
      return false;
    }
    return true;
  }
}
