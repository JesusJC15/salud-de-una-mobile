import { Stack } from 'expo-router';

export default function TriageLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F0F9FA' },
        headerTintColor: '#0891B2',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="specialty"
        options={{ title: 'Tipo de consulta', headerBackVisible: false }}
      />
      <Stack.Screen name="[sessionId]" options={{ title: 'Cuestionario' }} />
      <Stack.Screen
        name="result"
        options={{ title: 'Resultado', headerBackVisible: false }}
      />
      <Stack.Screen
        name="chat/[consultationId]"
        options={{ title: 'Chat con el médico' }}
      />
    </Stack>
  );
}
