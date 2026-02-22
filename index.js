const fastify = require("fastify");
const path = require("path");
const { server: wisp } = require("@mercuryworkshop/wisp-js/server");
const { scramjetPath } = require("@mercuryworkshop/scramjet/path");
const { epoxyPath } = require("@mercuryworkshop/epoxy-transport");
const { baremuxPath } = require("@mercuryworkshop/bare-mux/node");

const server = fastify();

server.register(require("@fastify/static"), {
  root: path.join(__dirname, "/public"),
  prefix: "/",
  decorateReply: true,
  setHeaders: (res, path) => {
    if (path.endsWith("sw.js")) {
      res.setHeader("Service-Worker-Allowed", "/");
    }
  },
});

server.register(require("@fastify/static"), {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});

server.register(require("@fastify/static"), {
  root: epoxyPath,
  prefix: "/epoxy/",
  decorateReply: false,
});

server.register(require("@fastify/static"), {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false,
});

server.register(require("@fastify/rate-limit"), {
  timeWindow: "1m",
  max: 50,
});

server.get("/ask", async function (req, res) {
  res.send("OK");
});

server.server.on("upgrade", (req, socket, head) => {
  socket.on("error", (err) => {
    console.error("WebSocket socket error:", err.message);
  });

  if (req.url.endsWith("/wisp/")) {
    try {
      wisp.routeRequest(req, socket, head);
    } catch (err) {
      console.error("Wisp routing error:", err.message);
      socket.destroy();
    }
  } else {
    socket.end();
  }
});

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const port = process.env.port || 2010;

server.listen({ port: port, host: "0.0.0.0" }).then(function () {
  console.log("AXIOM started!");
  console.log("Listening on port " + port);
  console.log("http://localhost:" + port + "/");
});
