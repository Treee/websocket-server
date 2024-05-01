import { readFileSync } from "fs";
import { createServer } from "https";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const SocketEnums = {
  ClientRegister: "ClientRegister",
  ClientUnRegister: "ClientUnRegister",
  PING: "PING",
  PONG: "PONG",
  TEST: "TEST",
  AGEOVERLAYPUSH: "AGEOVERLAYPUSH",
};

const httpsServer = createServer({
  cert: readFileSync("./keys/original_cert.pem"),
  key: readFileSync("./keys/original_cert_key.pem"),
});
httpsServer.addListener("upgrade", (req, res, head) => console.log("UPGRADE:", req.url));
httpsServer.on("error", (err) => console.error(err));
httpsServer.listen(8443, () => console.log("HTTPS RUNNING ON PORT:8443"));

const wss = new WebSocketServer({ server: httpsServer, path: "/echo" });
const _clients = [];

/*
    Catestrophic error occured. Attempt to be graceful
*/
process.on("SIGHUP", () => {
  // clean up websockets if we can
  _clients.forEach((ws) => {
    ws.close();
  });
  wss.close();
  console.log("SIGHUP ERROR:: CLOSING WEB SOCKET SERVER");
  process.exit();
});

wss.on("connection", function connection(ws) {
  const uuid = sendRegistrationToClient(ws);
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("MESSAGE: %s", data);
    // console.log("server receives message: " + message);
    const msg = JSON.parse(message);
    console.log("PARSED MESSAGE:" + msg);
    const applicableWebsockets = getApplicableWebsockets(msg.toClientId);
    if (msg.type === SocketEnums.ClientRegister) {
      registerClientWebsocket(uuid, msg.data, ws);
    } else if (msg.type === SocketEnums.PING) {
      applicableWebsockets.forEach((websocket) => {
        websocket.socket.send(formatDataForWebsocket(SocketEnums.PONG, SocketEnums.PONG));
      });
    } else if (applicableWebsockets.length > 0) {
      if (isValidWebsocketMessageType(msg.type)) {
        applicableWebsockets.forEach((websocket) => {
          websocket.socket.send(formatDataForWebsocket(msg.type, msg.data));
        });
      }
    }
  });

  ws.on("close", (error) => {
    if (error) {
      console.log(error);
    }
    removeClientWebsocket(uuid);
  });
});

/*
    Generates a random guid for the client.
    Sends the guid to the client via a register message
    Returns the guid for the server to maintain in a list
*/
function sendRegistrationToClient(websocket) {
  const uuid = randomUUID();
  console.log(`SENDING CLIENT REGISTRATION:${uuid}`);
  websocket.send(formatDataForWebsocket(SocketEnums.ClientRegister, uuid));
  return uuid;
}
/*
    Formats the data for sending over a socket.
    This is to ensure some type of structure in the case of
    debugging or other investigations
*/
function formatDataForWebsocket(dataType, rawData) {
  if (SocketEnums[dataType] !== "PING") {
    console.log(`DataType: ${dataType} / RawData: ${JSON.stringify(rawData)}`);
  }
  return JSON.stringify({ type: dataType, data: rawData });
}
/*
    Is the given message type a valid one?
    Clamps down on what the socket server responds to
*/
function isValidWebsocketMessageType(messageType) {
  if (SocketEnums[messageType] === undefined) {
    return false;
  }
  return true;
}
/*
    Removes a websocket from the server list
*/
function removeClientWebsocket(uniqueId) {
  console.log(`REMOVING CLIENT WITH UIID: ${uniqueId}`);
  _clients = _clients.filter((sockets) => {
    return sockets.uuid !== uniqueId;
  });
}
/*
    Register a cleint websocket.
    uniqueID - is the server websocket guid
    clientId - is the client side identifier in case a user wants multiple "controllers"
    websocket - the client websocket
*/
function registerClientWebsocket(uniqueId, clientId, websocket) {
  console.log(`ADDING CLIENT ${clientId} WITH UIID ${uniqueId}`);
  this._clients.push({ uuid: uniqueId, id: clientId, socket: websocket });
}
/*
    Search through the list and find the websockets that match the CLIENT ID.
    This has the chance to return multiple websockets
*/
function getApplicableWebsockets(clientId) {
  const foundWebsockets = _clients.filter((socket) => {
    return socket.id === clientId;
  });
  return foundWebsockets;
}
