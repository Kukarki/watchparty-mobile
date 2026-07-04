import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { SOCKET_URL } from '@/constants';

class SocketService {
  private socket: Socket | null = null;
  // Bug fix #7: track in-flight connect promise to prevent concurrent socket creation
  private connectingPromise: Promise<Socket> | null = null;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = this._createSocket().finally(() => {
      this.connectingPromise = null;
    });
    return this.connectingPromise;
  }

  private async _createSocket(): Promise<Socket> {
    const token = await SecureStore.getItemAsync('auth_token');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get instance(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: unknown) {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
