type VoidHandler = () => void;

type MockSocket = {
  on: jest.Mock;
  disconnect: jest.Mock;
  io: {
    on: jest.Mock;
  };
  handlers: Record<string, VoidHandler>;
  managerHandlers: Record<string, VoidHandler>;
};

const ioMock = jest.fn();

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}));

jest.mock('@/src/constants/ws', () => ({
  WS_BASE_URL: 'https://api.test',
}));

function createMockSocket(): MockSocket {
  const handlers: Record<string, VoidHandler> = {};
  const managerHandlers: Record<string, VoidHandler> = {};

  const socket: MockSocket = {
    on: jest.fn((event: string, handler: VoidHandler) => {
      handlers[event] = handler;
    }),
    disconnect: jest.fn(),
    io: {
      on: jest.fn((event: string, handler: VoidHandler) => {
        managerHandlers[event] = handler;
      }),
    },
    handlers,
    managerHandlers,
  };

  return socket;
}

async function loadRealtimeModule() {
  return import('@/src/services/realtime/patient-notifications-realtime');
}

describe('subscribePatientNotificationsRealtime', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('connects, emits status transitions and emits new notifications', async () => {
    const socket = createMockSocket();
    ioMock.mockReturnValue(socket);

    const { subscribePatientNotificationsRealtime } = await loadRealtimeModule();
    const listener = jest.fn();

    const unsubscribe = subscribePatientNotificationsRealtime('access-token', listener);

    expect(ioMock).toHaveBeenCalledWith('https://api.test/notifications', {
      auth: { token: 'access-token' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 50,
    });
    expect(listener).toHaveBeenNthCalledWith(1, {
      type: 'status',
      status: 'disconnected',
    });
    expect(listener).toHaveBeenNthCalledWith(2, {
      type: 'status',
      status: 'connecting',
    });

    socket.handlers.connect();
    expect(listener).toHaveBeenLastCalledWith({
      type: 'status',
      status: 'connected',
    });

    socket.managerHandlers.reconnect_attempt();
    expect(listener).toHaveBeenLastCalledWith({
      type: 'status',
      status: 'reconnecting',
    });

    socket.handlers.connect_error();
    expect(listener).toHaveBeenLastCalledWith({
      type: 'status',
      status: 'reconnecting',
    });

    socket.handlers['notification:new']();
    expect(listener).toHaveBeenLastCalledWith({
      type: 'notification:new',
    });

    socket.handlers.disconnect();
    expect(listener).toHaveBeenLastCalledWith({
      type: 'status',
      status: 'disconnected',
    });

    unsubscribe();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('reuses the same socket for equal token and disconnects only when last consumer unsubscribes', async () => {
    const socket = createMockSocket();
    ioMock.mockReturnValue(socket);

    const { subscribePatientNotificationsRealtime } = await loadRealtimeModule();
    const firstListener = jest.fn();
    const secondListener = jest.fn();

    const unsubscribeFirst = subscribePatientNotificationsRealtime('same-token', firstListener);
    const unsubscribeSecond = subscribePatientNotificationsRealtime('same-token', secondListener);

    expect(ioMock).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    expect(socket.disconnect).not.toHaveBeenCalled();

    unsubscribeSecond();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('recreates socket when token changes', async () => {
    const firstSocket = createMockSocket();
    const secondSocket = createMockSocket();
    ioMock.mockReturnValueOnce(firstSocket).mockReturnValueOnce(secondSocket);

    const { subscribePatientNotificationsRealtime } = await loadRealtimeModule();
    const firstListener = jest.fn();
    const secondListener = jest.fn();

    const unsubscribeFirst = subscribePatientNotificationsRealtime('token-1', firstListener);
    const unsubscribeSecond = subscribePatientNotificationsRealtime('token-2', secondListener);

    expect(ioMock).toHaveBeenCalledTimes(2);
    expect(firstSocket.disconnect).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
    expect(secondSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
