
const { ethers } = require("hardhat");

async function main() {
  const initialSupply = ethers.utils.parseUnits('1',6)

  const Lock = await ethers.getContractFactory("ERC20Token");
  const lock = await Lock.deploy('ERC20','TKN',initialSupply);

  await lock.deployed();

  console.log(`deployed to ${lock.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
