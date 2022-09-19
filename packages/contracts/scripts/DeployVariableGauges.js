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
  //   "symbol": "WBTC",
  //   "address": "0x321162Cd933E2Be498Cd2267a90534A804051b11"
  // },
  // {
  //   "symbol": "WETH",
  //   "address": "0x74b23882a30290451A17c44f4F05243b6b58C76d"
  // },
  // {
  //   "symbol": "AVAX",
  //   "address": "0x511D35c52a3C244E7b8bd92c0C297755FbD89212"
  // },
  // {
  //   "symbol": "MATIC",
  //   "address": "0x40DF1Ae6074C35047BFF66675488Aa2f9f6384F3"
  // },
  // {
  //   "symbol": "BNB",
  //   "address": "0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454"
  // },

  // {
  //   "symbol": "USDT",
  //   "address": "0x049d68029688eAbF473097a2fC38ef61633A3C7A"
  // },
  // {
  //   "symbol": "DAI",
  //   "address": "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E"
  // },
  // {
  //   "symbol": "alUSD",
  //   "address": "0xB67FA6deFCe4042070Eb1ae1511Dcd6dcc6a532E"
  // },
  // {
  //   "symbol": "MIM",
  //   "address": "0x82f0B8B456c1A451378467398982d4834b6829c1"
  // },
  // {
  //   "symbol": "FRAX",
  //   "address": "0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355"
  // },
  // {
  //   "symbol": "MAI",
  //   "address": "0xfb98b335551a418cd0737375a2ea0ded62ea213b"
  // },
  // {
  //   "symbol": "DEI",
  //   "address": "0xDE12c7959E1a72bbe8a5f7A1dc8f8EeF9Ab011B3"
  // },
  // {
  //   "symbol": "BUSD",
  //   "address": "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50"
  // },

  // {
  //   "symbol": "LQDR",
  //   "address": "0x10b620b2dbAC4Faa7D7FFD71Da486f5D44cd86f9"
  // },
  {
    "symbol": "BIFI",
    "address": "0xd6070ae98b8069de6B494332d1A1a81B6179D960"
  },
  // {
  //   "symbol": "gSCARAB",
  //   "address": "0x6ab5660f0B1f174CFA84e9977c15645e4848F5D6"
  // },
  // {
  //   "symbol": "CRE8R",
  //   "address": "0x2ad402655243203fcfa7dcb62f8a08cc2ba88ae0"
  // },
  // {
  //   "symbol": "DEUS",
  //   "address": "0xde5ed76e7c05ec5e4572cfc88d1acea165109e44"
  // },
  // {
  //   "symbol": "RING",
  //   "address": "0x582423C10c9e83387a96d00A69bA3D11ee47B7b5"
  // },
  // {
  //   "symbol": "TREEB",
  //   "address": "0xc60D7067dfBc6f2caf30523a064f416A5Af52963"
  // },
  // {
  //   "symbol": "OATH",
  //   "address": "0x21Ada0D2aC28C3A5Fa3cD2eE30882dA8812279B6"
  // },
  // {
  //   "symbol": "gOHM",
  //   "address": "0x91fa20244Fb509e8289CA630E5db3E9166233FDc"
  // },
  // {
  //   "symbol": "SPELL",
  //   "address": "0x468003B688943977e6130F4F68F23aad939a1040"
  // },
  // {
  //   "symbol": "CRV",
  //   "address": "0x1E4F97b9f9F913c46F1632781732927B9019C68b"
  // },
  // {
  //   "symbol": "TAROT",
  //   "address": "0xC5e2B037D30a390e62180970B3aa4E91868764cD"
  // },
  // {
  //   "symbol": "LINK",
  //   "address": "0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8"
  // },
  // {
  //   "symbol": "YFI",
  //   "address": "0x29b0Da86e484E1C0029B56e817912d778aC0EC69"
  // },
  // {
  //   "symbol": "MULTI",
  //   "address": "0x9Fb9a33956351cf4fa040f65A13b835A3C8764E3"
  // },
  // {
  //   "symbol": "FXS",
  //   "address": "0x7d016eec9c25232b01F23EF992D98ca97fc2AF5a"
  // },
  // {
  //   "symbol": "gALCX",
  //   "address": "0x70F9fd19f857411b089977E7916c05A0fc477Ac9"
  // },
  // {
  //   "symbol": "COMB",
  //   "address": "0xae45a827625116d6c0c40b5d7359ecf68f8e9afd"
  // },

 ]

 const FTM = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
 const FACTORYV2 = '0x9d3591719038752db0c8bEEe2040FfcC3B2c6B9c';  
 const ROUTER_v2 = '0x09855B4ef0b9df961ED097EF50172be3e6F13665';
 const inSPIRIT = '0x2FBFf41a9efAEAE77538bd63f1ea489494acdc08';
 const SPIRIT = '0x5Cc61A78F164885776AA610fb0FE1257df78E59B';

 const VARIABLE_BRIBE_FACTORY = '0x2d0Ffb56F0945ce719eac4A79e1CD2b8B64d03D0';
 const VARIABLE_GAUGE_PROXY = '0xfe1C8A68351B52E391e10106BD3bf2d0759AFf4e';

 
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
  const routerv2 = await ethers.getContractAt("contracts/AMM/BaseV1Router01.sol:BaseV1Router01", ROUTER_v2);
  console.log("here1");
  await Promise.all(tokens.map(async tkn => {
    
    const token = await ethers.getContractAt("contracts/UniV2-AMM/SpiritRouterV1.sol:IERC20", tkn.address);

    // 3. Get LP address from factory
    const factory = await ethers.getContractAt("contracts/AMM/BaseV1Factory.sol:BaseV1Factory", FACTORYV2);
    const LP = await factory.getPair(FTM, token.address, false);
    console.log('LP address: ', LP);

    // 4. Using that LP create a gauge in GaugeProxy contract
    const gaugeProxy = await ethers.getContractAt("VariableGaugeProxy", VARIABLE_GAUGE_PROXY);
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
        contract: "contracts/SpiritV2/VariableGaugeProxy.sol:Gauge",
        constructorArguments: [ 
        SPIRIT, 
        inSPIRIT, 
        LP,
        VARIABLE_GAUGE_PROXY
        ],
    });

    await hre.run("verify:verify", {
        address: BRIBE_ADDR,
        contract: "contracts/SpiritV2/Bribes.sol:Bribe",
        constructorArguments: [ 
            await gaugeProxy.governance(), // update to do
            VARIABLE_GAUGE_PROXY,
            VARIABLE_BRIBE_FACTORY
        ],
    });

  }));

}

async function verifyGauge() {
  await hre.run("verify:verify", {
      address: "0x401EA5e5aAD28E7d4d21620308521165bb9ef4B9",
      contract: "contracts/SpiritV2/StableGaugeProxy.sol:Gauge",
      constructorArguments: [ 
      SPIRIT, 
      inSPIRIT, 
      "0x842C44870eD021f070938D077ca2Cf2DC474eCa6",
      VARIABLE_GAUGE_PROXY
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
  