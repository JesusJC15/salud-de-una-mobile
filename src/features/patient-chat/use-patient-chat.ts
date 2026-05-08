import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { appConfig } from '@/src/config/env';
import { useSessionStore } from '@/src/store/session-store';

function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end--;
  return end === url.length ? url : url.slice(0, end);
}

const WS_BASE_URL = trimTrailingSlashes(
  (appConfig.apiBaseUrl ?? 'http://localhost:3000').replace(/\/v1$/, ''),
);

export type ChatMessage = {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  content: string;
  type: 'TEXT';
  createdAt?: string;
};

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function usePatientChat(consultationId: string | null, initialIsClosed = false) {
  const session = useSessionStore((s) => s.session);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isClosed, setIsClosed] = useState(initialIsClosed);

  useEffect(() => {
    setIsClosed(initialIsClosed);
  }, [initialIsClosed]);

  useEffect(() => {
    if (!consultationId || !session?.accessToken) return;

    let mounted = true;
    setStatus('connecting');

    const socket = io(`${WS_BASE_URL}/chat`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mounted) return;
      setStatus('connected');
      socket.emit('chat:join', { consultationId });
    });

    socket.on('chat:history', ({ messages: history }: { messages: ChatMessage[] }) => {
      if (!mounted) return;
      setMessages(history);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      if (!mounted) return;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:error', (err: { code: string; message: string }) => {
      if (!mounted) return;
      if (err.code === 'FORBIDDEN' && err.message.includes('cerrada')) {
        setIsClosed(true);
      }
    });

    socket.on('disconnect', () => {
      if (!mounted) return;
      setStatus('disconnected');
    });

    return () => {
      mounted = false;
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setStatus('disconnected');
    };
  }, [consultationId, session?.accessToken]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !consultationId || isClosed) return;
      socketRef.current.emit('chat:send', { consultationId, content });
    },
    [consultationId, isClosed],
  );

  return { messages, status, sendMessage, currentUserId: session?.user.id ?? '', isClosed };
}
