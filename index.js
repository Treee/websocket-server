import { readFileSync } from "fs";
import { createServer } from "https";
import { WebSocketServer } from "ws";

const httpsServer = createServer({
  cert: readFileSync("./keys/original_cert.pem"),
  key: readFileSync("./keys/original_cert_key.pem"),
});
httpsServer.addListener("upgrade", (req, res, head) => console.log("UPGRADE:", req.url));
httpsServer.on("error", (err) => console.error(err));
httpsServer.listen(8443, () => console.log("Https running on port 8443"));

const wss = new WebSocketServer({ server: httpsServer, path: "/echo" });
wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });

  ws.send("Hello");
});
