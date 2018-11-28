import promisify from "./web3-promisfy";

function getBlockNumber(web3) {
  return promisify(web3, 'getBlockNumber');
}

function getBlock(web3, blockNumber) {
  return promisify(web3, 'getBlock', blockNumber);
}

async function calculateEstimatedGas(web3) {
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

  const gasUsed = blocks.map(block => block ? block.gasUsed : false);
  gasUsed.filter(gas => typeof gas === 'number').sort((x, y) => x - y);

  const bottomThreeAverage = gasUsed.slice(0, 3).reduce((total, x) => total + x) / 3;
  return Math.floor(bottomThreeAverage);
}

let estimatedGas = null;
let estimatedGasPoll;

export async function startPollingEstimatedGas(web3) {
  if (estimatedGasPoll) {
    return;
  }
  estimatedGas = await calculateEstimatedGas(web3);
  estimatedGasPoll = setInterval(async () => {
    estimatedGas = await calculateEstimatedGas(web3) || estimatedGas;
  }, 30000);
}

export function getEstimatedGas() {
  return estimatedGas;
}
