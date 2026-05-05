import React from "react";
import VideoTile from "./VideoTile";

const VideoGrid = ({ localStream, remoteStreams, participants, selfId, mediaStates, speakingUsers }) => {
  // Build list: self first, then others
  const tiles = [
    { userId: selfId, stream: localStream, name: "You", isSelf: true },
    ...Object.entries(remoteStreams).map(([uid, stream]) => {
      const p = participants.find((x) => x.userId === uid);
      return { userId: uid, stream, name: p?.name || "Participant", isSelf: false };
    }),
  ];

  const count = tiles.length;
  const cols = count <= 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 2 : 3;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px", width: "100%" }}>
      {tiles.map(({ userId, stream, name, isSelf }) => {
        const state = mediaStates[userId] || {};
        return (
          <VideoTile
            key={userId}
            stream={stream}
            name={name}
            isSelf={isSelf}
            isMuted={state.micOn === false}
            isCameraOff={state.cameraOn === false}
            isSpeaking={speakingUsers?.has(userId)}
          />
        );
      })}
    </div>
  );
};

export default VideoGrid;
