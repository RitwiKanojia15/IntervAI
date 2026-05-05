require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDatabase = require("./config/db");
const { initializeSocketServer } = require("./services/socketService");
const autoSeedVersant = require("./data/versantAutoSeed");

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000";

const startServer = async () => {
  try {
    await connectDatabase();
    await autoSeedVersant();
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: CLIENT_ORIGIN,
        credentials: true,
      },
    });

    initializeSocketServer(io);

    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Test server listening on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
