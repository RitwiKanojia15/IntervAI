import { useEffect } from "react";
import { io } from "socket.io-client";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const useLiveTestSocket = ({ testId, onLeaderboardUpdate, onTestStarted }) => {
  useEffect(() => {
    if (!testId) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.emit("live-test:join-room", { testId });

    if (onLeaderboardUpdate) {
      socket.on("live-test:leaderboard:update", onLeaderboardUpdate);
    }
    if (onTestStarted) {
      socket.on("testStarted", onTestStarted);
      socket.on("live-test:update", onTestStarted);
    }

    return () => {
      socket.emit("live-test:leave-room", { testId });
      if (onLeaderboardUpdate) {
        socket.off("live-test:leaderboard:update", onLeaderboardUpdate);
      }
      if (onTestStarted) {
        socket.off("testStarted", onTestStarted);
        socket.off("live-test:update", onTestStarted);
      }
      socket.disconnect();
    };
  }, [onLeaderboardUpdate, onTestStarted, testId]);
};

export default useLiveTestSocket;
