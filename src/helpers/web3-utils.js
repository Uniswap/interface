import promisify from "./web3-promisfy";

function getBlockNumber(web3) {
  return promisify(web3, 'getBlockNumber');
}

function getBlock(web3, blockNumber) {
  return promisify(web3, 'getBlock', blockNumber);
}

export async function getEstimatedGas(web3) {
  const lastBlockNumber = await getBlockNumber(web3);
  const getBlockPromises = [];
  for (var i = 0; i < 40; i++) {
    getBlockPromises.push(getBlock(web3, lastBlockNumber - i));
  }

  let blocks;
  try {
    blocks = await Promise.all(getBlockPromises);
  } catch (e) {
    return null;
  }

  const gasUsed = blocks.map(block => block.gasUsed);

  // Sort then get the 32nd number (the number that covers 80% of cases)
  // and multiply by 1.25 for a margin of safety.
  gasUsed.sort((x, y) => x - y);
  return Math.floor(gasUsed[31] * 1.25);
}
