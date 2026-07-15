// WebRTC voice feature is disabled — react-native-webrtc removed to fix startup crash
export function useWebRTC(_roomId: string, _userId: string) {
  return {
    cleanup: () => {},
    localStream: null,
    isScreenSharing: false,
    remoteScreenStream: null,
    startScreenShare: async () => {},
    stopScreenShare: async () => {},
  };
}
