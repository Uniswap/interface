import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9 } from 'state/migrations/9'
import { migration10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { migration12 } from 'state/migrations/12'
import { migration13 } from 'state/migrations/13'
import { migration14 } from 'state/migrations/14'
import { migration15 } from 'state/migrations/15'
import { migration16 } from 'state/migrations/16'
import { migration17 } from 'state/migrations/17'
import { migration18 } from 'state/migrations/18'
import { migration19 } from 'state/migrations/19'
import { migration20 } from 'state/migrations/20'
import { migration21 } from 'state/migrations/21'
import { migration22 } from 'state/migrations/22'
import { migration23 } from 'state/migrations/23'
import { migration24 } from 'state/migrations/24'
import { GetCapabilitiesStatus } from 'state/walletCapabilities/types'

// Previous state with no walletCapabilities (common case)
const previousStateWithoutCapabilities = {
  _persist: {
    version: 23,
    rehydrated: true,
  },
}

// Previous state with legacy walletCapabilities format
const previousStateWithLegacyCapabilities = {
  _persist: {
    version: 23,
    rehydrated: true,
  },
  walletCapabilities: {
    isAtomicBatchingSupported: 'Unknown',
  },
}

const migrator = createMigrate(
  {
    1: migration1,
    2: migration2,
    3: migration3,
    4: migration4,
    5: migration5,
    6: migration6,
    7: migration7,
    8: migration8,
    9: migration9,
    10: migration10,
    11: migration11,
    12: migration12,
    13: migration13,
    14: migration14,
    15: migration15,
    16: migration16,
    17: migration17,
    18: migration18,
    19: migration19,
    20: migration20,
    21: migration21,
    22: migration22,
    23: migration23,
    24: migration24,
  },
  { debug: false },
)

describe('migration to v24', () => {
  it('should add walletCapabilities with initial state if it does not exist', async () => {
    const result: any = await migrator(previousStateWithoutCapabilities, 24)
    expect(result.walletCapabilities).toEqual({
      getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
      byChain: {},
    })
  })

  it('should reset legacy walletCapabilities with isAtomicBatchingSupported=Unknown format', async () => {
    const result: any = await migrator(previousStateWithLegacyCapabilities, 24)
    expect(result.walletCapabilities).toEqual({
      getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
      byChain: {},
    })
  })

  it('should reset walletCapabilities if byChain is missing', async () => {
    const stateWithInvalidWalletCapabilities = {
      ...previousStateWithoutCapabilities,
      walletCapabilities: {
        // Missing byChain property
        getCapabilitiesStatus: GetCapabilitiesStatus.Supported,
      },
    }
    const result: any = await migrator(stateWithInvalidWalletCapabilities, 24)
    expect(result.walletCapabilities).toEqual({
      getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
      byChain: {},
    })
  })

  it('should reset walletCapabilities if getCapabilitiesStatus is missing', async () => {
    const stateWithInvalidWalletCapabilities = {
      ...previousStateWithoutCapabilities,
      walletCapabilities: {
        byChain: { '0x1': { test: true } },
        // Missing getCapabilitiesStatus property
      },
    }
    const result: any = await migrator(stateWithInvalidWalletCapabilities, 24)
    expect(result.walletCapabilities).toEqual({
      getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
      byChain: {},
    })
  })

  it('should reset legacy walletCapabilities with isAtomicBatchingSupported=Supported format', async () => {
    const stateWithLegacyWalletCapabilities = {
      ...previousStateWithoutCapabilities,
      walletCapabilities: {
        // Old format with isAtomicBatchingSupported
        isAtomicBatchingSupported: 'Supported',
      },
    }
    const result: any = await migrator(stateWithLegacyWalletCapabilities, 24)
    expect(result.walletCapabilities).toEqual({
      getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
      byChain: {},
    })
  })

  it('should preserve walletCapabilities if it has valid structure', async () => {
    const validWalletCapabilities = {
      getCapabilitiesStatus: GetCapabilitiesStatus.Supported,
      byChain: {
        '0x1': { supportsAtomicBatching: true },
        '0x89': { supportsAtomicBatching: false },
      },
    }
    const stateWithValidWalletCapabilities = {
      ...previousStateWithoutCapabilities,
      walletCapabilities: validWalletCapabilities,
    }
    const result: any = await migrator(stateWithValidWalletCapabilities, 24)
    expect(result.walletCapabilities).toEqual(validWalletCapabilities)
  })

  it('should not modify other properties in the state', async () => {
    const stateWithOtherProperties = {
      ...previousStateWithoutCapabilities,
      someOtherProperty: 'test value',
    }
    const result: any = await migrator(stateWithOtherProperties, 24)
    expect(result.someOtherProperty).toEqual('test value')
  })

  it('should update the persist version to 24', async () => {
    const result: any = await migrator(previousStateWithoutCapabilities, 24)
    expect(result._persist.version).toEqual(24)
  })
})
