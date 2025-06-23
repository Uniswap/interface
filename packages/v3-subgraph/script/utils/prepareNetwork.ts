import * as dotenv from 'dotenv'
import * as fsExtra from 'fs-extra'
import * as path from 'path'
import * as process from 'process'

export enum NETWORK {
  ARBITRUM = 'arbitrum-one',
  AVALANCHE = 'avalanche',
  BASE = 'base',
  BLAST = 'blast-mainnet',
  BSC = 'bsc',
  CELO = 'celo',
  ETHEREUM = 'ethereum',
  MATIC = 'matic',
  OPTIMISM = 'optimism',
  SONEIUM = 'soneium-mainnet',
  UNICHAIN = 'unichain-mainnet',
  WORLDCHAIN = 'worldchain-mainnet',
  ZKSYNC_ERA = 'zksync-era',
  ZORA = 'zora-mainnet',
  SMARTBCH = 'smartbch',
}

export enum SUBGRAPH_TYPE {
  V3_TOKENS = 'v3-tokens',
  V3 = 'v3',
}

const CHAIN_CONSTANTS_FILE_NAME = 'chain.ts'
const SUBGRAPH_ENV_FILE_NAME = '.subgraph-env'

export function validateNetwork(network: string): void {
  if (!network) {
    console.error('no network parameter passed')
    process.exit(-1)
  }

  if (
    !Object.values(NETWORK)
      .map((n) => n.toString())
      .includes(network)
  ) {
    console.error('invalid network parameter passed, pass either: ', ...Object.values(NETWORK))
    process.exit(-1)
  }
}

export function validateSubgraphType(subgraphType: string): void {
  if (!subgraphType) {
    console.error('no subgraph name parameter passed')
    process.exit(-1)
  }

  if (
    !Object.values(SUBGRAPH_TYPE)
      .map((n) => n.toString())
      .includes(subgraphType)
  ) {
    console.error('invalid subgraph name parameter passed, pass either: ', ...Object.values(SUBGRAPH_TYPE))
    process.exit(-1)
  }
}

export function getSubgraphName(subgraphType: string): string {
  dotenv.config({ path: '.subgraph-env' })
  if (subgraphType === SUBGRAPH_TYPE.V3_TOKENS) {
    if (!process.env.V3_TOKEN_SUBGRAPH_NAME) {
      throw new Error('V3_TOKEN_SUBGRAPH_NAME must be set')
    }
    return process.env.V3_TOKEN_SUBGRAPH_NAME
  }
  if (!process.env.V3_SUBGRAPH_NAME) {
    throw new Error('V3_SUBGRAPH_NAME must be set')
  }
  return process.env.V3_SUBGRAPH_NAME
}

export function getAlchemyDeploymentParams(): {
  node: string
  ipfs: string
  deployKey: string
} {
  dotenv.config()
  if (!process.env.ALCHEMY_DEPLOY_URL || !process.env.ALCHEMY_IPFS_URL || !process.env.ALCHEMY_DEPLOY_KEY) {
    throw new Error('ALCHEMY_DEPLOY_URL, ALCHEMY_IPFS_URL, and ALCHEMY_DEPLOY_KEY must be set')
  }
  return {
    node: process.env.ALCHEMY_DEPLOY_URL,
    ipfs: process.env.ALCHEMY_IPFS_URL,
    deployKey: process.env.ALCHEMY_DEPLOY_KEY,
  }
}

export async function prepare(network: string, subgraphName: string): Promise<void> {
  try {
    console.log(`preparing config for ${network} ${subgraphName} subgraph`)
    const chainConstantsFilePath = path.join(__dirname + '/../../config/' + network + '/' + CHAIN_CONSTANTS_FILE_NAME)
    const subgraphEnvFilePath = path.join(__dirname + '/../../config/' + network + '/' + SUBGRAPH_ENV_FILE_NAME)
    const chainConstantsOutputPath = path.join(__dirname + '/../../src/common/' + CHAIN_CONSTANTS_FILE_NAME)
    const subgraphEnvOutputPath = path.join(__dirname + '/../../' + SUBGRAPH_ENV_FILE_NAME)

    console.log('chain constants path:', chainConstantsFilePath, ' to:', chainConstantsOutputPath)

    fsExtra.copySync(chainConstantsFilePath, chainConstantsOutputPath)
    fsExtra.copySync(subgraphEnvFilePath, subgraphEnvOutputPath)
  } catch (error) {
    console.error(error)
  }
}
