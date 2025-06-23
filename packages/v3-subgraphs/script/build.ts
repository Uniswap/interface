import yargs from 'yargs'

import { build, deploy } from './utils/deploy-utils'
import { validateNetwork, validateSubgraphType } from './utils/prepareNetwork'

async function main(): Promise<void> {
  const argv = yargs(process.argv.slice(2))
    .option('network', {
      alias: 'n',
      description: 'Network to build for',
      type: 'string',
      demandOption: true,
    })
    .option('subgraph-type', {
      alias: 's',
      description: 'Type of the subgraph',
      type: 'string',
      demandOption: true,
    })
    .option('deploy', {
      alias: 'd',
      description: 'Deploy the subgraph',
      type: 'boolean',
      default: false,
    })
    .help().argv
  validateNetwork(argv.network)
  validateSubgraphType(argv.subgraphType)
  await build(argv.network, argv.subgraphType)
  if (argv.deploy) {
    await deploy(argv.subgraphType)
  }
}

main()
