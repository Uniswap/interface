import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'

import { act, renderHook } from '../test-utils/render'
import { ActivationStatus, useActivationState } from './activate'
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

beforeEach(() => {
  console.error = jest.fn()
})

it('Should initialize with proper empty state', async () => {
  const result = renderHook(useActivationState).result

  expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
})

it('Should call activate function on a connection', async () => {
  const activationResponse = createDeferredPromise()
  const mockConnection = createMockConnection(jest.fn().mockImplementation(() => activationResponse.promise))

  const result = renderHook(useActivationState).result
  const onSuccess = jest.fn()

  let activationCall: Promise<void> = new Promise(jest.fn())
  act(() => {
    activationCall = result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.activationState).toEqual({ status: ActivationStatus.PENDING, connection: mockConnection })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)

  activationResponse.resolve()
  await activationCall

  expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(1)
})

it('Should properly deactivate pending connection attempts', async () => {
  const mockConnection = createMockConnection(
    jest.fn().mockImplementation(() => new Promise(jest.fn())),
    jest.fn().mockImplementation(() => Promise.resolve())
  )

  const result = renderHook(useActivationState).result
  const onSuccess = jest.fn()

  act(() => {
    result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.activationState).toEqual({ status: ActivationStatus.PENDING, connection: mockConnection })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)

  await act(() => result.current.cancelActivation())

  expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
  expect(mockConnection.connector.deactivate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)
})

it('Should properly display error state', async () => {
  const activationResponse = createDeferredPromise()
  const mockConnection = createMockConnection(
    jest.fn().mockImplementation(() => activationResponse.promise),
    jest.fn().mockImplementation(() => Promise.resolve())
  )

  const result = renderHook(useActivationState).result
  const onSuccess = jest.fn()

  act(() => {
    result.current.tryActivation(mockConnection, onSuccess)
  })

  expect(result.current.activationState).toEqual({ status: ActivationStatus.PENDING, connection: mockConnection })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)

  await act(async () => {
    activationResponse.reject('Failed to connect')
  })

  expect(result.current.activationState).toEqual({
    status: ActivationStatus.ERROR,
    connection: mockConnection,
    error: 'Failed to connect',
  })
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

  const result = renderHook(useActivationState).result
  const onSuccess = jest.fn()

  await act(() => result.current.tryActivation(mockConnection, onSuccess))

  expect(result.current.activationState).toEqual({
    status: ActivationStatus.ERROR,
    connection: mockConnection,
    error: 'Failed to connect',
  })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(1)
  expect(onSuccess).toHaveBeenCalledTimes(0)

  await act(() => result.current.tryActivation(mockConnection, onSuccess))

  expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
  expect(mockConnection.connector.activate).toHaveBeenCalledTimes(2)
  expect(onSuccess).toHaveBeenCalledTimes(1)
})

describe('Should gracefully handle intentional user-rejection errors', () => {
  it('handles Injected user-rejection error', async () => {
    const result = renderHook(useActivationState).result

    const injectedConection = createMockConnection(
      jest
        .fn()
        .mockImplementationOnce(() => Promise.reject({ code: ErrorCode.USER_REJECTED_REQUEST }))
        .mockImplementationOnce(() => Promise.resolve),
      jest.fn(),
      ConnectionType.INJECTED
    )

    const onSuccess = jest.fn()

    await act(() => result.current.tryActivation(injectedConection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(injectedConection.connector.activate).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)

    await act(() => result.current.tryActivation(injectedConection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(injectedConection.connector.activate).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('handles Coinbase user-rejection error', async () => {
    const result = renderHook(useActivationState).result

    const coinbaseConnection = createMockConnection(
      jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(ErrorCode.CB_REJECTED_REQUEST))
        .mockImplementationOnce(() => Promise.resolve),
      jest.fn(),
      ConnectionType.COINBASE_WALLET
    )

    const onSuccess = jest.fn()

    await act(() => result.current.tryActivation(coinbaseConnection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(coinbaseConnection.connector.activate).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)

    await act(() => result.current.tryActivation(coinbaseConnection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(coinbaseConnection.connector.activate).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('handles WalletConect Modal close error', async () => {
    const result = renderHook(useActivationState).result

    const wcConnection = createMockConnection(
      jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(ErrorCode.WC_MODAL_CLOSED))
        .mockImplementationOnce(() => Promise.resolve),
      jest.fn(),
      ConnectionType.WALLET_CONNECT
    )

    const onSuccess = jest.fn()

    await act(() => result.current.tryActivation(wcConnection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(wcConnection.connector.activate).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)

    await act(() => result.current.tryActivation(wcConnection, onSuccess))

    expect(result.current.activationState).toEqual({ status: ActivationStatus.EMPTY })
    expect(wcConnection.connector.activate).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
