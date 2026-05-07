import { useEffect } from "react";
import { io } from "socket.io-client";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * useLiveTestSocket
 *
 * Manages the socket.io connection for a live test room.
 *
 * @param {object} options
 * @param {string}   options.testId              - The live test ID to join
 * @param {function} options.onLeaderboardUpdate - Called with leaderboard payload on update
 * @param {function} options.onTestStarted       - Called when the host starts the test
 * @param {function} options.onViolationUpdate   - Called with violation payload (host panel)
 */
const useLiveTestSocket = ({
  testId,
  onLeaderboardUpdate,
  onTestStarted,
  onViolationUpdate,
}) => {
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
    if (onViolationUpdate) {
      socket.on("live-test:violation", onViolationUpdate);
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
      if (onViolationUpdate) {
        socket.off("live-test:violation", onViolationUpdate);
      }
      socket.disconnect();
    };
  }, [onLeaderboardUpdate, onTestStarted, onViolationUpdate, testId]);
};

export default useLiveTestSocket;
