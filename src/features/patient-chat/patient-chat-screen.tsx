import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/src/ui/themed-text';
import type { ChatMessage } from './use-patient-chat';
import { usePatientChat } from './use-patient-chat';

const PALETTE = {
  bg: ['#F0F9FA', '#E0F2F1'] as const,
  primary: '#0891B2',
  teal: '#14B8A6',
  title: '#0F172A',
  subtitle: '#475569',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(20,184,166,0.18)',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
};

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Conectando...',
  connected: 'En línea',
  disconnected: 'Desconectado',
};

const STATUS_COLOR: Record<string, string> = {
  connecting: '#D97706',
  connected: '#059669',
  disconnected: '#94A3B8',
};

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isOwn && (
        <ThemedText style={styles.senderLabel}>
          {msg.senderRole === 'PATIENT' ? 'Tú' : 'Médico'}
        </ThemedText>
      )}
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: PALETTE.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: PALETTE.cardBg, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: PALETTE.cardBorder },
        ]}
      >
        <ThemedText style={[styles.bubbleText, { color: isOwn ? '#FFFFFF' : PALETTE.title }]}>
          {msg.content}
        </ThemedText>
        {msg.createdAt && (
          <ThemedText style={[styles.timeText, { color: isOwn ? 'rgba(255,255,255,0.65)' : PALETTE.subtitle }]}>
            {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function PatientChatScreen({ consultationId }: { consultationId: string }) {
  const { messages, status, sendMessage, currentUserId } = usePatientChat(consultationId);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || status !== 'connected') return;
    sendMessage(trimmed);
    setInput('');
  };

  return (
    <LinearGradient colors={PALETTE.bg} style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: PALETTE.cardBg }]}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] ?? '#94A3B8' }]} />
        <ThemedText style={[styles.statusText, { color: STATUS_COLOR[status] ?? '#94A3B8' }]}>
          {STATUS_LABEL[status] ?? 'Desconectado'}
        </ThemedText>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={36} color={PALETTE.subtitle} />
            <ThemedText style={[styles.emptyText, { color: PALETTE.subtitle }]}>
              {status === 'connected'
                ? 'Sin mensajes aún. Escribe para iniciar.'
                : 'Conectando al chat...'}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble msg={item} isOwn={item.senderId === currentUserId} />
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: PALETTE.cardBg, borderTopColor: PALETTE.inputBorder }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={status === 'connected' ? 'Escribe un mensaje...' : 'Esperando conexión...'}
            placeholderTextColor={PALETTE.subtitle}
            editable={status === 'connected'}
            multiline
            style={[styles.textInput, { backgroundColor: PALETTE.inputBg, borderColor: PALETTE.inputBorder }]}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || status !== 'connected'}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: (!input.trim() || status !== 'connected') ? '#94A3B8' : PALETTE.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: {
    alignItems: 'center', flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(20,184,166,0.12)',
  },
  statusDot: { borderRadius: 4, height: 8, width: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  messageList: { flexGrow: 1, gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  emptyState: { alignItems: 'center', gap: 10, marginTop: 60 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  bubbleWrapper: { maxWidth: '78%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  senderLabel: { fontSize: 11, fontWeight: '700', color: '#14B8A6', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  timeText: { fontSize: 11, textAlign: 'right' },
  inputBar: {
    alignItems: 'flex-end', borderTopWidth: 1, flexDirection: 'row',
    gap: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  textInput: {
    borderRadius: 16, borderWidth: 1, flex: 1, fontSize: 15,
    maxHeight: 100, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center', borderRadius: 12, height: 44,
    justifyContent: 'center', width: 44,
  },
});
