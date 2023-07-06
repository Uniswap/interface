import { SessionTypes } from '@walletconnect/types'

import { getSupportedChainIdsFromWalletConnectSession } from './getSupportedChainIdsFromWalletConnectSession'

const testSession: SessionTypes.Struct = {
  topic: 'string',
  pairingTopic: 'string',
  relay: { protocol: '', data: '' },
  expiry: 4132684800000,
  acknowledged: true,
  controller: 'string',
  namespaces: {},
  requiredNamespaces: {
    'eip155:1': {
      chains: ['1'],
      methods: [],
      events: [],
    },
  },
  optionalNamespaces: {
    'eip155:137': {
      chains: ['137'],
      methods: [],
      events: [],
    },
  },
  sessionProperties: {},
  self: {
    publicKey: 'string',
    metadata: {
      name: 'string',
      description: 'string',
      url: 'string',
      icons: ['string'],
      verifyUrl: 'string',
      redirect: {
        native: 'string',
        universal: 'string',
      },
    },
  },
  peer: {
    publicKey: 'string',
    metadata: {
      name: 'string',
      description: 'string',
      url: 'string',
      icons: ['string'],
      verifyUrl: 'string',
      redirect: {
        native: 'string',
        universal: 'string',
      },
    },
  },
}
describe('getSupportedChainIdsFromWalletConnectSession', () => {
  it('supports eip155:<chain> namespaces', () => {
    const namespaces = {
      'eip155:1': {
        chains: ['1'],
        accounts: ['eip155:1:0xc0ffee254729296a45a3885639AC7E10F9d54979'],
        methods: [],
        events: [],
      },
      'eip155:137': {
        chains: ['137'],
        accounts: ['eip155:137:0xdeadbeef'],
        methods: [],
        events: [],
      },
    }
    const session = {
      ...testSession,
      namespaces,
    }
    const result = getSupportedChainIdsFromWalletConnectSession(session)
    expect(result).toEqual([1, 137])
  })
  it('supports eip155 namespaces without chains field', () => {
    const namespaces = {
      eip155: {
        accounts: ['eip155:1:0xc0ffee254729296a45a3885639AC7E10F9d54979', 'eip155:137:address'],
        methods: [],
        events: [],
      },
    }
    const session = {
      ...testSession,
      namespaces,
    }
    const result = getSupportedChainIdsFromWalletConnectSession(session)
    expect(result).toEqual([1, 137])
  })
  it('supports eip155 namespaces with chains field', () => {
    const namespaces = {
      eip155: {
        chains: ['1', '137'],
        accounts: ['eip155:1:0xc0ffee254729296a45a3885639AC7E10F9d54979', 'eip155:137:address'],
        methods: [],
        events: [],
      },
    }
    const session = {
      ...testSession,
      namespaces,
    }
    const result = getSupportedChainIdsFromWalletConnectSession(session)
    expect(result).toEqual([1, 137])
  })
  it('supports eip155:<chain> namespaces without a chain property', () => {
    const namespaces = {
      'eip155:1': {
        accounts: ['eip155:1:0xc0ffee254729296a45a3885639AC7E10F9d54979'],
        methods: [],
        events: [],
      },
      'eip155:137': {
        accounts: ['eip155:137:0xdeadbeef'],
        methods: [],
        events: [],
      },
    }
    const session = {
      ...testSession,
      namespaces,
    }
    const result = getSupportedChainIdsFromWalletConnectSession(session)
    expect(result).toEqual([1, 137])
  })
})
