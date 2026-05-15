const useCallbackMock = jest.fn();
const useContextMock = jest.fn();
const useEffectMock = jest.fn();
const useMemoMock = jest.fn();
const useRefMock = jest.fn();
const useStateMock = jest.fn();

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useCallback: useCallbackMock,
    useContext: useContextMock,
    useEffect: useEffectMock,
    useMemo: useMemoMock,
    useRef: useRefMock,
    useState: useStateMock,
  };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: {
    create: <T,>(styles: T) => styles,
  },
  View: 'View',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

jest.mock('@/src/ui/themed-text', () => ({
  ThemedText: 'ThemedText',
}));

jest.mock('@/src/constants/theme', () => ({
  Radius: {
    lg: 12,
  },
}));

type ProviderRender = {
  type: unknown;
  props: {
    value: {
      showToast: (input: {
        message: string;
        type?: 'success' | 'error' | 'warning' | 'info';
        actionLabel?: string;
        onAction?: () => void;
        durationMs?: number;
      }) => void;
      hideToast: () => void;
    };
    children?: unknown;
  };
};

type ToastState = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
} | null;

function flattenNodes(node: unknown): unknown[] {
  if (!node || typeof node !== 'object') {
    return [];
  }

  const typedNode = node as { props?: { children?: unknown } };
  const children = typedNode.props?.children;
  const asArray = Array.isArray(children)
    ? children
    : children === undefined || children === null
      ? []
      : [children];

  return [node, ...asArray.flatMap((child) => flattenNodes(child))];
}

describe('ToastProvider', () => {
  let currentToast: ToastState;
  let setToast: jest.Mock;
  let timerRef: { current: ReturnType<typeof setTimeout> | null };
  let effectCleanups: (((() => void) | undefined))[];
  let setTimeoutSpy: jest.SpiedFunction<typeof setTimeout>;
  let clearTimeoutSpy: jest.SpiedFunction<typeof clearTimeout>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    currentToast = null;
    effectCleanups = [];
    setToast = jest.fn((next: ToastState | ((state: ToastState) => ToastState)) => {
      currentToast = typeof next === 'function' ? next(currentToast) : next;
    });
    timerRef = { current: null };

    useCallbackMock.mockImplementation((fn: unknown) => fn);
    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      const cleanup = callback();
      effectCleanups.push(typeof cleanup === 'function' ? cleanup : undefined);
    });
    useMemoMock.mockImplementation((factory: () => unknown) => factory());
    useRefMock.mockReturnValue(timerRef);
    useStateMock.mockImplementation(() => [currentToast, setToast]);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it('ignores blank messages', async () => {
    const { ToastProvider } = await import('@/src/providers/toast-provider');

    const rendered = ToastProvider({ children: 'child' }) as unknown as ProviderRender;
    rendered.props.value.showToast({ message: '   ' });

    expect(setToast).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('shows info toast by default and auto-hides it after timeout', async () => {
    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const rendered = ToastProvider({ children: 'child' }) as unknown as ProviderRender;
    rendered.props.value.showToast({ message: 'Guardado' });

    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1700000000000,
        message: 'Guardado',
        type: 'info',
      }),
    );
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

    const timeoutCallback = setTimeoutSpy.mock.calls[0][0] as () => void;
    timeoutCallback();

    expect(setToast).toHaveBeenLastCalledWith(expect.any(Function));
    const finalState = (setToast.mock.calls.at(-1) as [((state: ToastState) => ToastState)])[0](currentToast);
    expect(finalState).toBeNull();

    nowSpy.mockRestore();
  });

  it('clears an existing timeout when showing another toast and supports custom duration', async () => {
    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const existingTimer = setTimeout(() => undefined, 5000);
    timerRef.current = existingTimer;

    const rendered = ToastProvider({ children: 'child' }) as unknown as ProviderRender;
    rendered.props.value.showToast({
      message: 'Actualizado',
      type: 'success',
      durationMs: 1200,
    });

    expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimer);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 1200);
  });

  it('hides the active toast immediately', async () => {
    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const existingTimer = setTimeout(() => undefined, 1000);
    timerRef.current = existingTimer;

    const rendered = ToastProvider({ children: 'child' }) as unknown as ProviderRender;
    rendered.props.value.hideToast();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimer);
    expect(setToast).toHaveBeenCalledWith(null);
    expect(timerRef.current).toBeNull();
  });

  it('clears pending timer during unmount cleanup', async () => {
    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const existingTimer = setTimeout(() => undefined, 1000);
    timerRef.current = existingTimer;

    ToastProvider({ children: 'child' });
    effectCleanups.forEach((cleanup) => cleanup?.());

    expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimer);
  });

  it('invokes action callback and hide on action press', async () => {
    const onAction = jest.fn();
    currentToast = {
      id: 1,
      message: 'Error de red',
      type: 'warning',
      actionLabel: 'Reintentar',
      onAction,
    };
    useStateMock.mockImplementation(() => [currentToast, setToast]);

    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const rendered = ToastProvider({ children: 'child' });
    const pressables = flattenNodes(rendered).filter((node) => {
      if (!node || typeof node !== 'object') {
        return false;
      }
      return (node as { type?: unknown }).type === 'Pressable';
    }) as { props: { onPress: () => void } }[];

    expect(pressables).toHaveLength(1);
    pressables[0].props.onPress();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith(null);
  });

  it('closes toast using the default close button when no action label exists', async () => {
    currentToast = {
      id: 2,
      message: 'Sin accion',
      type: 'info',
    };
    useStateMock.mockImplementation(() => [currentToast, setToast]);

    const { ToastProvider } = await import('@/src/providers/toast-provider');
    const rendered = ToastProvider({ children: 'child' });
    const pressables = flattenNodes(rendered).filter((node) => {
      if (!node || typeof node !== 'object') {
        return false;
      }
      return (node as { type?: unknown }).type === 'Pressable';
    }) as { props: { onPress: () => void } }[];

    expect(pressables).toHaveLength(1);
    pressables[0].props.onPress();
    expect(setToast).toHaveBeenCalledWith(null);
  });

  it('uses context in useToast hook', async () => {
    const contextValue = {
      showToast: jest.fn(),
      hideToast: jest.fn(),
    };
    useContextMock.mockReturnValue(contextValue);

    const { useToast } = await import('@/src/providers/toast-provider');
    expect(useToast()).toBe(contextValue);
  });
});
