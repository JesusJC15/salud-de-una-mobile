import { io, type Socket } from 'socket.io-client';

import { WS_BASE_URL } from '@/src/constants/ws';

export type NotificationsRealtimeStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

type RealtimeEvent =
  | { type: 'status'; status: NotificationsRealtimeStatus }
  | { type: 'notification:new' };

type RealtimeListener = (event: RealtimeEvent) => void;

let socket: Socket | null = null;
let activeToken: string | null = null;
let consumerCount = 0;
let connectionStatus: NotificationsRealtimeStatus = 'disconnected';
const listeners = new Set<RealtimeListener>();

function emit(event: RealtimeEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

function setConnectionStatus(nextStatus: NotificationsRealtimeStatus) {
  if (connectionStatus === nextStatus) {
    return;
  }
  connectionStatus = nextStatus;
  emit({ type: 'status', status: nextStatus });
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  activeToken = null;
  setConnectionStatus('disconnected');
}

function connectSocket(accessToken: string) {
  if (socket && activeToken === accessToken) {
    return;
  }

  disconnectSocket();
  activeToken = accessToken;
  setConnectionStatus('connecting');

  const nextSocket = io(`${WS_BASE_URL}/notifications`, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionAttempts: 50,
  });

  nextSocket.on('connect', () => {
    setConnectionStatus('connected');
  });

  nextSocket.io.on('reconnect_attempt', () => {
    setConnectionStatus('reconnecting');
  });

  nextSocket.on('disconnect', () => {
    setConnectionStatus('disconnected');
  });

  nextSocket.on('connect_error', () => {
    setConnectionStatus('reconnecting');
  });

  nextSocket.on('notification:new', () => {
    emit({ type: 'notification:new' });
  });

  socket = nextSocket;
}

export function subscribePatientNotificationsRealtime(
  accessToken: string,
  listener: RealtimeListener,
) {
  listeners.add(listener);
  consumerCount += 1;
  listener({ type: 'status', status: connectionStatus });
  connectSocket(accessToken);

  return () => {
    listeners.delete(listener);
    consumerCount = Math.max(consumerCount - 1, 0);

    if (consumerCount === 0) {
      disconnectSocket();
    }
  };
}
