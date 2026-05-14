import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WS_BASE_URL } from '@/src/constants/ws';
import { useSessionStore } from '@/src/store/session-store';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClosed(initialIsClosed);
  }, [initialIsClosed]);

  useEffect(() => {
    if (!consultationId || !session?.accessToken) return;

    let mounted = true;
    setStatus('connecting');
    setErrorMessage(null);

    const socket = io(`${WS_BASE_URL}/chat`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 50,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mounted) return;
      setStatus('connected');
      setErrorMessage(null);
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
      if (err.code === 'FORBIDDEN') {
        if (err.message.includes('cerrada')) {
          setIsClosed(true);
        } else {
          // Consultation pending assignment or other access error
          setErrorMessage(err.message);
        }
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

  return {
    messages,
    status,
    sendMessage,
    currentUserId: session?.user.id ?? '',
    isClosed,
    errorMessage,
  };
}
