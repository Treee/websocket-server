import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";
import { SocketEnums } from "./common/common-data.js";

class MyWebSocketServer {
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
    this._adminSocket.on("connection", this.onClientConnection);
    console.log(`Listening on port: ${this._socketPort}`);
  }

  onClientConnection(ws) {
    const uuid = this.sendRegistrationToClient(ws);
    ws.on("message", this.onMessageReceived, message, uuid);
    ws.on("close", this.onClose, err, uuid);
    ws.on("error", this.onError, err, uuid);
  }
  onMessageReceived(message, uuid) {
    // console.log(message);
    const msg = JSON.parse(message);
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
  }
  onError(error, uuid) {
    console.log(error);
  }
  onClose(error, uuid) {
    if (error) {
      console.log(error);
    }
    this.removeWebsocket(uuid);
  }

  getApplicableWebsockets(clientId) {
    const foundWebsockets = this.clients.filter((socket) => {
      return socket.id === clientId;
    });
    return foundWebsockets;
  }
  formatDataForWebsocket(dataType, rawData) {
    if (SocketEnums[dataType] !== "PING") {
      console.log(`DataType: ${dataType} / RawData: ${rawData}`);
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
    this.clients.push({ uuid: uniqueId, id: clientId, socket: websocket });
  }
  removeWebsocket(uniqueId) {
    console.log(`Attempting to remove client with UIID ${uniqueId}`);
    this.clients = this.clients.filter((sockets) => {
      return sockets.uuid !== uniqueId;
    });
  }
  isValidWebsocketMessageType(messageType) {
    if (SocketEnums[messageType] === undefined) {
      return false;
    }
    return true;
    // let validMessageType = false;
    // for (let socketEnum in SocketEnums) {
    //   validMessageType = validMessageType || socketEnum == messageType;
    //   // console.log(`checking msgType:${msg.type} again ${socketEnum} result:${(socketEnum == msg.type)}`);
    // }
    // //ignore pings and registers
    // validMessageType = messageType !== "PING";
    // validMessageType = messageType !== "ClientRegister";
    // return validMessageType;
  }
}
export { MyWebSocketServer };
