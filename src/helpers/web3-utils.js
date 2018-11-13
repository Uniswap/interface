import promisify from "./web3-promisfy";

export function getBlockDeadline(web3, deadline) {
  return new Promise(async (resolve, reject) => {
    const blockNumber = await promisify(web3, 'getBlockNumber');
    console.log('blockNumber', blockNumber);
    if (!blockNumber && blockNumber !== 0) {
      return reject();
    }

    const block = await promisify(web3, 'getBlock', blockNumber);
    console.log('block', block);
    if (!block) {
      return reject();
    }

    resolve(block.timestamp + deadline);
  });
}
