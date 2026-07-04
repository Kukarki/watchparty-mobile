import { useEffect, useRef, useCallback, useState } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import type RTCIceCandidateEvent from 'react-native-webrtc/lib/typescript/RTCIceCandidateEvent';
import { socketService } from '@/services/socket';
import { SOCKET_EVENTS } from '@/constants';
import { useRoomStore } from '@/stores/room.store';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface WebRTCSessionDesc {
  sdp: string;
  type: string | null;
}

interface WebRTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}

interface PeerMap {
  [userId: string]: RTCPeerConnection;
}

export function useWebRTC(roomId: string, userId: string) {
  const peersRef = useRef<PeerMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const { isMuted, isCameraOn, isVoiceActive, setScreenSharing } = useRoomStore();
  const [isScreenSharing, setIsScreenSharingLocal] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

  const isCameraOnRef = useRef(isCameraOn);
  useEffect(() => { isCameraOnRef.current = isCameraOn; }, [isCameraOn]);

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: isCameraOnRef.current,
    });
    localStreamRef.current = stream as MediaStream;
    return stream as MediaStream;
  }, []);

  const createPeer = useCallback(
    async (targetUserId: string, isInitiator: boolean) => {
      const peer = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetUserId] = peer;

      const stream = await getLocalStream();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      // Capture remote tracks (for screen share display)
      (peer as unknown as EventTarget).addEventListener('track', (event: Event) => {
        const e = event as any;
        if (e.streams?.[0]) {
          remoteStreamsRef.current[targetUserId] = e.streams[0];
          const videoTracks = e.streams[0].getVideoTracks();
          if (videoTracks.length > 0) {
            setRemoteScreenStream(e.streams[0]);
          }
        }
      });

      (peer as unknown as EventTarget).addEventListener(
        'icecandidate',
        (event: Event) => {
          const e = event as unknown as RTCIceCandidateEvent<'icecandidate'>;
          if (e.candidate) {
            socketService.emit(SOCKET_EVENTS.WEBRTC_ICE, {
              roomId,
              targetUserId,
              candidate: e.candidate,
            });
          }
        }
      );

      if (isInitiator) {
        const offer = await peer.createOffer({});
        await peer.setLocalDescription(offer);
        socketService.emit(SOCKET_EVENTS.WEBRTC_OFFER, { roomId, targetUserId, offer });
      }

      return peer;
    },
    [roomId, getLocalStream]
  );

  const handleOffer = useCallback(
    async (data: { fromUserId: string; offer: WebRTCSessionDesc }) => {
      const peer = await createPeer(data.fromUserId, false);
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketService.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
        roomId,
        targetUserId: data.fromUserId,
        answer,
      });
    },
    [createPeer, roomId]
  );

  const handleAnswer = useCallback(
    async (data: { fromUserId: string; answer: WebRTCSessionDesc }) => {
      const peer = peersRef.current[data.fromUserId];
      if (peer) await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    },
    []
  );

  const handleIce = useCallback(
    async (data: { fromUserId: string; candidate: WebRTCIceCandidateInit }) => {
      const peer = peersRef.current[data.fromUserId];
      if (peer) await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    },
    []
  );

  useEffect(() => {
    if (!isVoiceActive) return;

    socketService.on(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer as (...args: unknown[]) => void);
    socketService.on(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer as (...args: unknown[]) => void);
    socketService.on(SOCKET_EVENTS.WEBRTC_ICE, handleIce as (...args: unknown[]) => void);
    socketService.emit(SOCKET_EVENTS.VOICE_JOIN, { roomId, userId });

    return () => {
      socketService.off(SOCKET_EVENTS.WEBRTC_OFFER, handleOffer as (...args: unknown[]) => void);
      socketService.off(SOCKET_EVENTS.WEBRTC_ANSWER, handleAnswer as (...args: unknown[]) => void);
      socketService.off(SOCKET_EVENTS.WEBRTC_ICE, handleIce as (...args: unknown[]) => void);
    };
  }, [isVoiceActive, roomId, userId, handleOffer, handleAnswer, handleIce]);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });
  }, [isMuted]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (isCameraOn && stream.getVideoTracks().length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      mediaDevices.getUserMedia({ audio: true, video: true }).then((newStream) => {
        localStreamRef.current = newStream as MediaStream;
        Object.values(peersRef.current).forEach((peer) => {
          (newStream as MediaStream).getTracks().forEach((track) => {
            const sender = peer.getSenders().find((s) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              peer.addTrack(track, newStream as MediaStream);
            }
          });
        });
      }).catch(() => {});
    } else {
      stream.getVideoTracks().forEach((t) => { t.enabled = isCameraOn; });
    }
  }, [isCameraOn]);

  // ── Screen Share ────────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await (mediaDevices as any).getDisplayMedia({ video: true });
      screenStreamRef.current = stream as MediaStream;
      const videoTrack = (stream as MediaStream).getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            peer.addTrack(videoTrack, stream as MediaStream);
          }
        });
      }
      setIsScreenSharingLocal(true);
      setScreenSharing(true);
      socketService.emit(SOCKET_EVENTS.SCREEN_SHARE_START, { roomId, userId });
    } catch (err) {
      console.warn('Screen share unavailable:', err);
    }
  }, [roomId, userId, setScreenSharing]);

  const stopScreenShare = useCallback(async () => {
    const stream = screenStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    const localStream = localStreamRef.current;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0] ?? null;
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
    setIsScreenSharingLocal(false);
    setScreenSharing(false);
    socketService.emit(SOCKET_EVENTS.SCREEN_SHARE_STOP, { roomId, userId });
  }, [roomId, userId, setScreenSharing]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    Object.values(peersRef.current).forEach((p) => p.close());
    peersRef.current = {};
    socketService.emit(SOCKET_EVENTS.VOICE_LEAVE, { roomId, userId });
  }, [roomId, userId]);

  return {
    cleanup,
    localStream: localStreamRef.current,
    isScreenSharing,
    remoteScreenStream,
    startScreenShare,
    stopScreenShare,
  };
}
