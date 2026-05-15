import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import {
  consultationHistoryService,
  type ConsultationMessage,
} from '@/src/features/patient-consultations/consultation-history-service';
import { WS_BASE_URL } from '@/src/constants/ws';
import { useSessionStore } from '@/src/store/session-store';

export type ChatMessage = {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  type: string;
  createdAt?: string;
};

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

function toChatMessage(message: ConsultationMessage): ChatMessage {
  return {
    id: message.id,
    consultationId: message.consultationId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    content: message.content,
    type: message.type,
    createdAt: message.createdAt,
  };
}

function mergeMessagesById(current: ChatMessage[], incoming: ChatMessage[]) {
  const seen = new Set<string>();
  const merged: ChatMessage[] = [];

  for (const message of [...current, ...incoming]) {
    if (seen.has(message.id)) {
      continue;
    }
    seen.add(message.id);
    merged.push(message);
  }

  merged.sort((a, b) => {
    const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTs - bTs;
  });

  return merged;
}

export function usePatientChat(consultationId: string | null, initialIsClosed = false) {
  const session = useSessionStore((s) => s.session);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [isClosed, setIsClosed] = useState(initialIsClosed);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  useEffect(() => {
    setIsClosed(initialIsClosed);
  }, [initialIsClosed]);

  const loadMessagesFallback = useCallback(async () => {
    if (!consultationId) {
      return;
    }

    setIsFallbackLoading(true);

    try {
      const response = await consultationHistoryService.getMessages(consultationId, 100);
      const nextMessages = response.items.map(toChatMessage);
      setMessages((prev) => mergeMessagesById(prev, nextMessages));
      setErrorMessage(null);
    } catch {
      setErrorMessage('No pudimos sincronizar mensajes recientes. Revisa tu conexión.');
    } finally {
      setIsFallbackLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    if (!consultationId || !session?.accessToken) {
      setStatus('offline');
      setMessages([]);
      return;
    }

    let mounted = true;
    setStatus('connecting');
    setErrorMessage(null);
    void loadMessagesFallback();

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

    socket.io.on('reconnect_attempt', () => {
      if (!mounted) return;
      setStatus('reconnecting');
    });

    socket.on('chat:history', ({ messages: history }: { messages: ChatMessage[] }) => {
      if (!mounted) return;
      setMessages(history);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      if (!mounted) return;
      setMessages((prev) => mergeMessagesById(prev, [msg]));
    });

    socket.on('chat:error', (err: { code: string; message: string }) => {
      if (!mounted) return;
      if (err.code === 'FORBIDDEN') {
        if (err.message.includes('cerrada')) {
          setIsClosed(true);
          return;
        }

        setErrorMessage(err.message);
      }
    });

    socket.on('connect_error', () => {
      if (!mounted) return;
      setStatus('reconnecting');
      void loadMessagesFallback();
    });

    socket.on('disconnect', (reason) => {
      if (!mounted) return;
      if (reason === 'io client disconnect') {
        setStatus('offline');
        return;
      }

      setStatus('reconnecting');
      void loadMessagesFallback();
    });

    return () => {
      mounted = false;
      socket.disconnect();
      socketRef.current = null;
      setMessages([]);
      setStatus('offline');
    };
  }, [consultationId, loadMessagesFallback, session?.accessToken]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !consultationId || isClosed || status !== 'connected') return;
      socketRef.current.emit('chat:send', { consultationId, content });
    },
    [consultationId, isClosed, status],
  );

  const retryConnection = useCallback(() => {
    setErrorMessage(null);
    setStatus('connecting');

    if (socketRef.current) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      } else if (consultationId) {
        socketRef.current.emit('chat:join', { consultationId });
      }
    }

    void loadMessagesFallback();
  }, [consultationId, loadMessagesFallback]);

  return {
    messages,
    status,
    sendMessage,
    currentUserId: session?.user.id ?? '',
    isClosed,
    errorMessage,
    isFallbackLoading,
    refreshMessages: () => void loadMessagesFallback(),
    retryConnection,
  };
}
