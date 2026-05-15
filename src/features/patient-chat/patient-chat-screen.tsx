import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/src/ui/themed-text';

import { useConsultationPayment } from './use-consultation-payment';
import type { ChatMessage } from './use-patient-chat';
import { usePatientChat } from './use-patient-chat';

const PALETTE = {
  bg: ['#F0F9FA', '#E0F2F1'] as const,
  primary: '#0891B2',
  title: '#0F172A',
  subtitle: '#475569',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(20,184,166,0.18)',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
};

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Conectando',
  connected: 'En linea',
  reconnecting: 'Reconectando',
  offline: 'Sin conexion',
};

const STATUS_COLOR: Record<string, string> = {
  connecting: '#D97706',
  connected: '#059669',
  reconnecting: '#D97706',
  offline: '#64748B',
};

type PatientChatScreenProps = Readonly<{
  consultationId: string;
  isClosed?: boolean;
}>;

type MessageBubbleProps = Readonly<{
  msg: ChatMessage;
  isOwn: boolean;
}>;

type StatusBarProps = Readonly<{
  status: string;
  onRetry: () => void;
}>;

type EmptyStateProps = Readonly<{
  isFallbackLoading: boolean;
  status: string;
}>;

type PaymentBannerProps = Readonly<{
  alreadyPaid: boolean;
  paidAmountLabel: string;
  isPaying: boolean;
  hasPayError: boolean;
  onPay: () => void;
}>;

function getEmptyStateDescription(isFallbackLoading: boolean, status: string): string {
  if (isFallbackLoading) {
    return 'Sincronizando mensajes...';
  }

  if (status === 'connected') {
    return 'Sin mensajes aun. Escribe para iniciar.';
  }

  return 'Estamos intentando reconectar el chat.';
}

function getInputPlaceholder(isClosed: boolean, isConnected: boolean): string {
  if (isClosed) {
    return 'Consulta cerrada - solo lectura';
  }

  if (isConnected) {
    return 'Escribe un mensaje...';
  }

  return 'Esperando conexion...';
}

function MessageBubble({ msg, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isOwn ? (
        <ThemedText style={styles.senderLabel}>{msg.senderRole === 'PATIENT' ? 'Tu' : 'Medico'}</ThemedText>
      ) : null}
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: PALETTE.primary, borderBottomRightRadius: 4 }
            : {
                backgroundColor: PALETTE.cardBg,
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: PALETTE.cardBorder,
              },
        ]}
      >
        <ThemedText style={[styles.bubbleText, { color: isOwn ? '#FFFFFF' : PALETTE.title }]}>
          {msg.content}
        </ThemedText>
        {msg.createdAt ? (
          <ThemedText style={[styles.timeText, { color: isOwn ? 'rgba(255,255,255,0.65)' : PALETTE.subtitle }]}>
            {new Date(msg.createdAt).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function ChatStatusBar({ status, onRetry }: StatusBarProps) {
  return (
    <View style={[styles.statusBar, { backgroundColor: PALETTE.cardBg }]}>
      <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] ?? '#94A3B8' }]} />
      <ThemedText style={[styles.statusText, { color: STATUS_COLOR[status] ?? '#94A3B8' }]}>
        {STATUS_LABEL[status] ?? 'Sin conexion'}
      </ThemedText>
      {status === 'connected' ? null : (
        <Pressable onPress={onRetry} style={styles.retryConnectionBtn}>
          <ThemedText style={styles.retryConnectionText}>Reintentar</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function ChatEmptyState({ isFallbackLoading, status }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {isFallbackLoading ? (
        <ActivityIndicator color={PALETTE.primary} />
      ) : (
        <MaterialIcons name="chat-bubble-outline" size={36} color={PALETTE.subtitle} />
      )}
      <ThemedText style={[styles.emptyText, { color: PALETTE.subtitle }]}> 
        {getEmptyStateDescription(isFallbackLoading, status)}
      </ThemedText>
    </View>
  );
}

function ConsultationPaymentBanner({
  alreadyPaid,
  paidAmountLabel,
  isPaying,
  hasPayError,
  onPay,
}: PaymentBannerProps) {
  return (
    <View style={styles.paymentBanner}>
      {alreadyPaid ? (
        <View style={styles.paidRow}>
          <MaterialIcons name="check-circle" size={18} color="#059669" />
          <ThemedText style={styles.paidText}>Consulta pagada - {paidAmountLabel}</ThemedText>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.payBtn, { opacity: isPaying || pressed ? 0.8 : 1 }]}
          disabled={isPaying}
          onPress={onPay}
        >
          {isPaying ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.payBtnText}>Procesando pago...</ThemedText>
            </>
          ) : (
            <>
              <MaterialIcons name="payment" size={18} color="#FFFFFF" />
              <ThemedText style={styles.payBtnText}>Pagar consulta</ThemedText>
            </>
          )}
        </Pressable>
      )}
      {hasPayError ? (
        <View style={styles.payErrorRow}>
          <ThemedText style={styles.payErrorText}>Error al procesar el pago.</ThemedText>
          <Pressable onPress={onPay} style={styles.retryLink}>
            <ThemedText style={styles.retryLinkText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function PatientChatScreen({
  consultationId,
  isClosed: initialIsClosed = false,
}: PatientChatScreenProps) {
  const {
    messages,
    status,
    sendMessage,
    currentUserId,
    isClosed,
    errorMessage,
    isFallbackLoading,
    retryConnection,
  } = usePatientChat(consultationId, initialIsClosed);

  const { alreadyPaid, paidTransaction, isPaying, isError: payError, pay } =
    useConsultationPayment(isClosed ? consultationId : null);

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isConnected = status === 'connected';
  const disableSend = isClosed || input.trim().length === 0 || !isConnected;
  const paidAmountLabel = paidTransaction
    ? `$${paidTransaction.amount.toLocaleString('es-CO')} COP`
    : '';

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed.length === 0 || !isConnected) {
      return;
    }

    sendMessage(trimmed);
    setInput('');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <LinearGradient colors={PALETTE.bg} style={styles.container}>
        <ChatStatusBar status={status} onRetry={retryConnection} />

        {errorMessage && !isClosed ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="info-outline" size={16} color="#D97706" />
            <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            <Pressable onPress={retryConnection} style={styles.retryLink}>
              <ThemedText style={styles.retryLinkText}>Reintentar</ThemedText>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<ChatEmptyState isFallbackLoading={isFallbackLoading} status={status} />}
          renderItem={({ item }) => <MessageBubble msg={item} isOwn={item.senderId === currentUserId} />}
        />

        {isClosed ? (
          <ConsultationPaymentBanner
            alreadyPaid={alreadyPaid}
            paidAmountLabel={paidAmountLabel}
            isPaying={isPaying}
            hasPayError={payError}
            onPay={() => void pay()}
          />
        ) : null}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.inputBar, { backgroundColor: PALETTE.cardBg, borderTopColor: PALETTE.inputBorder }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={getInputPlaceholder(isClosed, isConnected)}
              placeholderTextColor={PALETTE.subtitle}
              editable={!isClosed && isConnected}
              multiline
              style={[
                styles.textInput,
                { backgroundColor: PALETTE.inputBg, borderColor: PALETTE.inputBorder },
                isClosed && { opacity: 0.5 },
              ]}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={disableSend}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: disableSend ? '#94A3B8' : PALETTE.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F9FA' },
  paymentBanner: {
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  paidRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  paidText: { color: '#059669', fontSize: 14, fontWeight: '700' },
  payBtn: {
    alignItems: 'center',
    backgroundColor: '#0891B2',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  payErrorRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  payErrorText: { color: '#DC2626', fontSize: 12 },
  retryLink: { paddingHorizontal: 4 },
  retryLinkText: { color: '#0891B2', fontSize: 12, fontWeight: '700' },
  retryConnectionBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryConnectionText: {
    color: '#0891B2',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderTopColor: '#FDE68A',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: { color: '#D97706', flex: 1, fontSize: 13, lineHeight: 18 },
  container: { flex: 1 },
  statusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,184,166,0.12)',
  },
  statusDot: { borderRadius: 4, height: 8, width: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  messageList: { flexGrow: 1, gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  emptyState: { alignItems: 'center', gap: 10, marginTop: 60 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  bubbleWrapper: { maxWidth: '78%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14B8A6',
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  timeText: { fontSize: 11, textAlign: 'right' },
  inputBar: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
