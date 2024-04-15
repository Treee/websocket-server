import { readFileSync } from "fs";
import { createServer } from "https";
import MyWebSocketServer from "./src/websocket-server.js";
import { WebSocket } from "ws";

const httpsServer = createServer({
  cert: readFileSync("./keys/original_cert.pem"),
  key: readFileSync("./keys/original_cert_key.pem"),
});

const mySocketServer = new MyWebSocketServer();
mySocketServer.startServer(httpsServer);

httpsServer.listen(8443, "0.0.0.0", function listening() {
  const myWebSocket = new WebSocket(`wss://localhost:8443`, {
    rejectUnauthorized: false,
  });

  myWebSocket.on("error", console.error);
  // myWebSocket.on("open", function open() {
  //   // myWebSocket.send("data sent");
  // });
});
// const express = require("express");
// import express from "express";
// const app = express();

// app.listen(3000, () => {
//   console.log("Application started and Listening on port 3000");
// });

// const text = `
// <!DOCTYPE html>
// <html>
//   <head> </head>
//   <body>
//     <div class="center_div">
//       <h1>Hello World!</h1>
//       <p>This example contains some advanced CSS methods you may not have learned yet. But, we will explain these methods in a later chapter in the tutorial.</p>
//     </div>
//   </body>
// </html>
// `;

// app.get("/", (req, res) => {
//   res.send(text);
// });
