import { Fragment } from 'ethers/lib/utils'
import { mapValues } from 'lodash'

import Create2Deployer from './abis/Create2Deployer.json'
import ERC20Abi from './abis/erc20.json'
import TimelockAbi from './abis/ITimelock.json'
import MultiSig from './abis/MultiSig.json'
import PoolManager from './abis/pool-manager.json'
import ReleaseUbe from './abis/ReleaseUbe.json'
import UbeswapFactory from './abis/UbeswapFactory.json'
import UbeswapMoolaRouter from './abis/UbeswapMoolaRouter.json'
import UbeswapV2Router02 from './abis/UbeswapV2Router02.json'
import MultiCall from './multicall/abi.json'

const MULTISIG_ABI =
  'https://gist.githubusercontent.com/macalinao/265ef9f40d13b28a64e5ad19eec94f62/raw/4723e984481558895728542304a9727d85d9c259/multisig.json'

const TIMELOCK_ABI =
  'https://gist.githubusercontent.com/macalinao/1c1650844df047eeb815f4365478ca3a/raw/844b3c735a638ef2fe561cd86e6e23064e8faecd/timelock.json'

// TODO(igm): find a more scalable way to associate addresses with ABIs
export const knownABIUrls: Record<string, string> = {
  '0x7Cda830369F5Cff005dD078A4bbf0A37e8085f8B': MULTISIG_ABI,
  '0xDd038bd0244fFB7c6736439fB217586207979f9C': TIMELOCK_ABI,
}

export const KNOWN_ADDRESSES: Record<
  string,
  {
    name: string
    abi: Fragment[]
  }
> = {
  // Ubeswap
  // https://docs.ubeswap.org/code-and-contracts/contract-addresses
  '0x71e26d0E519D14591b9dE9a0fE9513A398101490': {
    name: 'UBE Token',
    abi: ERC20Abi as unknown as Fragment[],
  },
  '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC': {
    name: 'UBE Token (Old)',
    abi: ERC20Abi as unknown as Fragment[],
  },
  '0x471EcE3750Da237f93B8E339c536989b8978a438': {
    name: 'CELO',
    abi: ERC20Abi as unknown as Fragment[],
  },
  '0x918146359264C492BD6934071c6Bd31C854EDBc3': {
    name: 'mcUSD',
    abi: ERC20Abi as unknown as Fragment[],
  },
  '0x4a27c059FD7E383854Ea7DE6Be9c390a795f6eE3': {
    name: 'Create2 Deployer',
    abi: Create2Deployer as unknown as Fragment[],
  },
  '0x75F59534dd892c1f8a7B172D639FA854D529ada3': {
    name: 'Multicall',
    abi: MultiCall as unknown as Fragment[],
  },
  '0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0': {
    name: 'Release UBE',
    abi: ReleaseUbe as unknown as Fragment[],
  },
  '0x62d5b84bE28a183aBB507E125B384122D2C25fAE': {
    name: 'Ubeswap Factory',
    abi: UbeswapFactory as unknown as Fragment[],
  },
  '0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121': {
    name: 'Ubeswap Router',
    abi: UbeswapV2Router02 as unknown as Fragment[],
  },
  '0x9Ee3600543eCcc85020D6bc77EB553d1747a65D2': {
    name: 'Ubeswap Pool Manager',
    abi: PoolManager as unknown as Fragment[],
  },
  '0x9a4f417f7C23EDA400536C9fE3B14b1494c1C6a1': {
    name: 'Mining Token Allocator',
    abi: PoolManager as unknown as Fragment[],
  },
  '0x1BDB37DAA42E37bFCa4C5536AcF93b1173588981': {
    name: 'Ubeswap Executive Timelock',
    abi: TimelockAbi as unknown as Fragment[],
  },
  '0x177B042b284dD9B830d4eb179695bCC14044fD1A': {
    name: 'Ubeswap Community Timelock',
    abi: TimelockAbi as unknown as Fragment[],
  },
  '0xC45Cc58205132Fe29e0F96BAA3f4FA2BD88cD6D9': {
    name: 'Ubeswap Celo Reserve Timelock',
    abi: TimelockAbi as unknown as Fragment[],
  },
  '0x97A9681612482A22b7877afbF8430EDC76159Cae': {
    name: 'Ubeswap Governance Fees Timelock',
    abi: TimelockAbi as unknown as Fragment[],
  },
  '0xB58DA472Fd4ba76696DbF8Ba3cC23580C26093dA': {
    name: 'Ubeswap Multisig 1',
    abi: MultiSig as unknown as Fragment[],
  },
  '0x7D28570135A2B1930F331c507F65039D4937f66c': {
    name: 'Ubeswap Moola Router',
    abi: UbeswapMoolaRouter as unknown as Fragment[],
  },
}

export const knownABIs: Record<string, Fragment[]> = {
  ...mapValues(KNOWN_ADDRESSES, (addr) => addr.abi),
}
