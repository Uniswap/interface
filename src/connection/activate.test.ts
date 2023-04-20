import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { act, renderHook } from 'test-utils'

import { useActivateConnection } from './activate'
import { Connection, ConnectionType } from './types'
import { ErrorCode } from './utils'

type DeferredPromise = {
  promise: Promise<unknown>
  resolve: () => void
  reject: (reason: unknown) => void
}
function createDeferredPromise() {
  const defferedPromise = {} as DeferredPromise

  const promise = new Promise<void>((resolve, reject) => {
    defferedPromise.reject = reject
    defferedPromise.resolve = resolve
  })
  defferedPromise.promise = promise

  return defferedPromise
}

class MockConnector extends Connector {
  activate: () => void
  deactivate: () => void
  resetState = jest.fn()

  constructor(activate: () => void, deactivate?: () => void) {
    const actions = {
      startActivation: jest.fn(),
      update: jest.fn(),
      resetState: jest.fn(),
    }
    super(actions)

    this.activate = activate ?? jest.fn()
    this.deactivate = deactivate ?? jest.fn()
  }
}

function createMockConnection(
  activate: () => void,
  deactivate?: () => void,
  type = ConnectionType.INJECTED
): Connection {
  return {
    getName: () => 'Test Connection',
    hooks: {} as unknown as Web3ReactHooks,
    type,
    shouldDisplay: () => true,
    connector: new MockConnector(activate, deactivate),
  }
}

it('Should initialize with proper empty state', async () => {
  const result = renderHook(useActivateConnection).result

  expect(result.current.pending.connection).toBeUndefined()
  expect(result.current.pending.error).toBeUndefined()
})

it('Should call activate function on a connection', async () => {
  const activationResponse = createDeferredPromise()
  const mockConnection = createMockConnection(jest.fn().mockImplementation(() => activationResponse.promise))

  const result = renderHook(useActivateConnection).result
  const onSuccess = jest.fn()

  let activationCall: Promise<void> = new Promise(jest.fn())
  act(() => {
    activationCall = result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.pending.connection).toBe(mockConnection)
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)

  activationResponse.resolve()
  await activationCall

  expect(result.current.pending.connection).toBeUndefined()
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(1)
})

it('Should properly deactivate pending connection attempts', async () => {
  const mockConnection = createMockConnection(
    jest.fn().mockImplementation(() => new Promise(jest.fn())),
    jest.fn().mockImplementation(() => Promise.resolve())
  )

  const result = renderHook(useActivateConnection).result
  const onSuccess = jest.fn()

  act(() => {
    result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.pending.connection).toBe(mockConnection)
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)

  await act(() => result.current.cancelActivation())

  expect(result.current.pending.connection).toBeUndefined()
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.deactivate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)
})

it('Should properly display error state', async () => {
  const activationResponse = createDeferredPromise()
  const mockConnection = createMockConnection(
    jest.fn().mockImplementation(() => activationResponse.promise),
    jest.fn().mockImplementation(() => Promise.resolve())
  )

  const result = renderHook(useActivateConnection).result
  const onSuccess = jest.fn()

  act(() => {
    result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.pending.connection).toBe(mockConnection)
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)

  await act(async () => {
    activationResponse.reject('Failed to connect')
  })

  expect(result.current.pending.connection).toBe(mockConnection)
  expect(result.current.pending.error).toEqual('Failed to connect')
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)
})

it('Should successfully retry a failed activation', async () => {
  const mockConnection = createMockConnection(
    jest
      .fn()
      .mockImplementationOnce(() => Promise.reject('Failed to connect'))
      .mockImplementationOnce(() => Promise.resolve())
  )

  const result = renderHook(useActivateConnection).result
  const onSuccess = jest.fn()

  await act(() => result.current.tryActivation(mockConnection, onSuccess))

  expect(result.current.pending.connection).toBe(mockConnection)
  expect(result.current.pending.error).toEqual('Failed to connect')
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)

  await act(() => result.current.tryActivation(mockConnection, onSuccess))

  expect(result.current.pending.connection).toBeUndefined()
  expect(result.current.pending.error).toBeUndefined()
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(2)
  expect(onSuccess).toHaveBeenCalledTimes(1)
})

it('Should gracefully handle user connection rejection', async () => {
  const injectedConection = createMockConnection(
    jest
      .fn()
      .mockImplementationOnce(() => Promise.reject({ code: ErrorCode.USER_REJECTED_REQUEST }))
      .mockImplementationOnce(() => Promise.resolve),
    jest.fn(),
    ConnectionType.INJECTED
  )

  const coinbaseConnection = createMockConnection(
    jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(ErrorCode.CB_REJECTED_REQUEST))
      .mockImplementationOnce(() => Promise.resolve),
    jest.fn(),
    ConnectionType.COINBASE_WALLET
  )

  const wcConnection = createMockConnection(
    jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(ErrorCode.WC_MODAL_CLOSED))
      .mockImplementationOnce(() => Promise.resolve),
    jest.fn(),
    ConnectionType.COINBASE_WALLET
  )

  ;[injectedConection, coinbaseConnection, wcConnection].forEach(async (mockConnection) => {
    const result = renderHook(useActivateConnection).result
    const onSuccess = jest.fn()

    await act(() => result.current.tryActivation(mockConnection, onSuccess))

    expect(result.current.pending.connection).toBeUndefined()
    expect(result.current.pending.error).toBeUndefined()
    expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)

    await act(() => result.current.tryActivation(mockConnection, onSuccess))

    expect(result.current.pending.connection).toBeUndefined()
    expect(result.current.pending.error).toBeUndefined()
    expect(mockConnection.connector.activate).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
