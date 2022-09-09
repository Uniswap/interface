// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")

const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

 const tokens = [

  // {
  //     "symbol": "SPIRIT",
  //     "address": "0x5Cc61A78F164885776AA610fb0FE1257df78E59B",
  //     "decimals": 18
  // },
  {
      "symbol": "USDC",
      "address": "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
      "decimals": 6
  },

 ]

 const FTM = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
 const FACTORYV2 = '';  
 const ROUTER_v2 = '';
 const inSPIRIT = '0x2FBFf41a9efAEAE77538bd63f1ea489494acdc08';
 const SPIRIT = '0x5Cc61A78F164885776AA610fb0FE1257df78E59B';

 const ADMIN_GAUGE_PROXY = '0xAa425DBE8be9c29a311D6b73d54B7bB322A784eA';

 
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [wallet] = await ethers.getSigners();
  console.log('Using wallet: ', wallet.address);
  // const WFTM = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", FTM);
  // const routerv2 = await ethers.getContractAt("contracts/AMM/BaseV1Router01.sol:BaseV1Router01", ROUTER_v2);
  console.log("here1");
  await Promise.all(tokens.map(async tkn => {
    
    const token = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", tkn.address);

    const factory = await ethers.getContractAt("contracts/AMM/BaseV1Factory.sol:BaseV1Factory", FACTORYV2);
    const LP = await factory.getPair(FTM, token.address, false);
    console.log('LP address: ', LP);

    // 4. Using that LP create a gauge in GaugeProxy contract
    const gaugeProxy = await ethers.getContractAt("AdminGaugeProxy", ADMIN_GAUGE_PROXY);
    const addGaugeTrx = await gaugeProxy.addGauge(LP,       
      {
      gasPrice: ethers.gasPrice,
      }
    );
    await addGaugeTrx.wait();

    console.log("token done");
    // const LP = '0x96DA176737Cf3A42efb770b6C2B8e3dd29F78704';

    const GAUGE_ADDR = await gaugeProxy.gauges(LP);
    console.log('gauge addr: ', GAUGE_ADDR);

    await hre.run("verify:verify", {
        address: GAUGE_ADDR,
        contract: "contracts/SpiritV2/AdminGaugeProxy.sol:Gauge",
        constructorArguments: [ 
        SPIRIT, 
        inSPIRIT, 
        LP
        ],
    });

  }));

}

async function protocolAddress() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [wallet] = await ethers.getSigners();
  console.log('Using wallet: ', wallet.address);
  const WFTM = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", FTM);
  const routerv2 = await ethers.getContractAt("contracts/AMM/BaseV1Router01.sol:BaseV1Router01", ROUTER_v2);
  const factory = await ethers.getContractAt("contracts/AMM/BaseV1Factory.sol:BaseV1Factory", FACTORYV2);

  const LP = await factory.getPair(FTM, "0x5Cc61A78F164885776AA610fb0FE1257df78E59B", false);
  console.log('LP address: ', LP);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  