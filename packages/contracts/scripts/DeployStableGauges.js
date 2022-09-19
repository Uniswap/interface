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
  //   "symbol": "USDT",
  //   "address": "0x049d68029688eAbF473097a2fC38ef61633A3C7A"
  // },
  // {
  //   "symbol": "DAI",
  //   "address": "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E"
  // },
  // {
  //   "symbol": "MIM",
  //   "address": "0x82f0B8B456c1A451378467398982d4834b6829c1"
  // },
  // {
  //   "symbol": "FRAX",
  //   "address": "0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355"
  // },
  {
    "symbol": "MAI",
    "address": "0xfb98b335551a418cd0737375a2ea0ded62ea213b"
  },

 ]

 const USDCAddr = '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75';
 const FTM = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
 const FACTORYV2 = '0x9d3591719038752db0c8bEEe2040FfcC3B2c6B9c';  
 const ROUTER_v2 = '0x09855B4ef0b9df961ED097EF50172be3e6F13665';
 const inSPIRIT = '0x2FBFf41a9efAEAE77538bd63f1ea489494acdc08';
 const SPIRIT = '0x5Cc61A78F164885776AA610fb0FE1257df78E59B';
 const STABLE_BRIBE_FACTORY = '0xF3D0AAF4Ae6f67FA63f949D7FaE1F72A8a3006E0';
 const STABLE_GAUGE_PROXY = '0xad29B1060Dded121F4596b09F13Fa44c9d62BB49';
 
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [wallet] = await ethers.getSigners();
  console.log('Using wallet: ', wallet.address);
  const WFTM = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", FTM);
  const USDC = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", USDCAddr);
  const routerv2 = await ethers.getContractAt("contracts/AMM/BaseV1Router01.sol:BaseV1Router01", ROUTER_v2);
  console.log("here1");
  await Promise.all(tokens.map(async tkn => {
    
    const token = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", tkn.address);
    
    // 3. Get LP address from factory
    const factory = await ethers.getContractAt("contracts/AMM/BaseV1Factory.sol:BaseV1Factory", FACTORYV2);
    const LP = await factory.getPair(USDC.address, token.address, true);
    console.log('LP address: ', LP);

    // 4. Using that LP create a gauge in GaugeProxy contract
    const gaugeProxy = await ethers.getContractAt("StableGaugeProxy", STABLE_GAUGE_PROXY);
    const addGaugeTrx = await gaugeProxy.addGauge(LP,       
      {
      gasPrice: ethers.gasPrice,
      }
    );
    await addGaugeTrx.wait();

    console.log("token done");

    const GAUGE_ADDR = await gaugeProxy.gauges(LP);
    console.log('gauge addr: ', GAUGE_ADDR);
    const BRIBE_ADDR = await gaugeProxy.bribes(GAUGE_ADDR);
    console.log('BRIBE_ADDR addr: ', BRIBE_ADDR);

    await hre.run("verify:verify", {
        address: GAUGE_ADDR,
        contract: "contracts/SpiritV2/StableGaugeProxy.sol:Gauge",
        constructorArguments: [ 
        SPIRIT, 
        inSPIRIT, 
        LP,
        STABLE_GAUGE_PROXY
        ],
    });

    await hre.run("verify:verify", {
        address: BRIBE_ADDR,
        contract: "contracts/SpiritV2/Bribes.sol:Bribe",
        constructorArguments: [ 
            await gaugeProxy.governance(), // update to do
            STABLE_GAUGE_PROXY,
            STABLE_BRIBE_FACTORY
        ],
    });

  }));

}

async function verifyGauge() {
    await hre.run("verify:verify", {
        address: "0x8B8C47f904BF18541f93c7dFcb10F3A8451438a3",
        contract: "contracts/SpiritV2/StableGaugeProxy.sol:Gauge",
        constructorArguments: [ 
        SPIRIT, 
        inSPIRIT, 
        "0x9692129bb91b4E3942C0f17B0bdCC582Ff22fFB5",
        STABLE_GAUGE_PROXY
        ],
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  