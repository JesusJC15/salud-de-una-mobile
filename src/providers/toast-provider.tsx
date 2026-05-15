import { MaterialIcons } from '@expo/vector-icons';
import {
  type ComponentProps,
  createContext,
  useEffect,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastInput = {
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
  hideToast: () => void;
};

type ToastState = ToastInput & {
  id: number;
  type: ToastType;
};

const TOAST_DEFAULT_DURATION_MS = 3000;

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
  hideToast: () => undefined,
});

const TOAST_ICON_MAP: Record<ToastType, ComponentProps<typeof MaterialIcons>['name']> = {
  success: 'check-circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const TOAST_COLOR_MAP: Record<
  ToastType,
  { background: string; border: string; text: string; icon: string }
> = {
  success: {
    background: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    icon: '#059669',
  },
  error: {
    background: '#FEF2F2',
    border: '#FECACA',
    text: '#7F1D1D',
    icon: '#DC2626',
  },
  warning: {
    background: '#FFFBEB',
    border: '#FDE68A',
    text: '#92400E',
    icon: '#D97706',
  },
  info: {
    background: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E3A8A',
    icon: '#2563EB',
  },
};

export function ToastProvider({ children }: Readonly<PropsWithChildren>) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      if (!input.message.trim()) {
        return;
      }

      const nextToast: ToastState = {
        ...input,
        id: Date.now(),
        type: input.type ?? 'info',
      };

      setToast(nextToast);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const durationMs = input.durationMs ?? TOAST_DEFAULT_DURATION_MS;
      timerRef.current = setTimeout(() => {
        setToast((current) => (current?.id === nextToast.id ? null : current));
        timerRef.current = null;
      }, durationMs);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [hideToast, showToast],
  );

  const colors = toast ? TOAST_COLOR_MAP[toast.type] : null;
  const icon = toast ? TOAST_ICON_MAP[toast.type] : null;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && colors && icon ? (
        <SafeAreaView edges={['bottom', 'left', 'right']} pointerEvents="box-none" style={styles.overlay}>
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.toastCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.toastBody}>
              <MaterialIcons color={colors.icon} name={icon} size={18} />
              <ThemedText style={[styles.toastMessage, { color: colors.text }]}>
                {toast.message}
              </ThemedText>
            </View>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  toast.onAction?.();
                  hideToast();
                }}
                style={styles.actionButton}
              >
                <ThemedText style={[styles.actionText, { color: colors.icon }]}>
                  {toast.actionLabel}
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" hitSlop={8} onPress={hideToast} style={styles.closeButton}>
                <MaterialIcons color={colors.icon} name="close" size={18} />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    zIndex: 1200,
  },
  toastCard: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  toastBody: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  toastMessage: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 30,
  },
});
