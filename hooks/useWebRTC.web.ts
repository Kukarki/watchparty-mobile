// Web stub — react-native-webrtc has no web implementation.
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
