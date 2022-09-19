// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Tokens
const FTM = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
const BTC = '0x321162Cd933E2Be498Cd2267a90534A804051b11';
const ETH = '0x74b23882a30290451A17c44f4F05243b6b58C76d';
const CRV = '0x1E4F97b9f9F913c46F1632781732927B9019C68b';
const LQDR = '0x10b620b2dbAC4Faa7D7FFD71Da486f5D44cd86f9';
const BIFI = '0xd6070ae98b8069de6B494332d1A1a81B6179D960';
const USDC = '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75';
const DAI = '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E';
const FRAX = '0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355';
const USDT = '0x049d68029688eAbF473097a2fC38ef61633A3C7A';
const MIM = '0x82f0B8B456c1A451378467398982d4834b6829c1';

// Contracts
const ROUTER = '0xE71b29c760b39A1eb243A5386bB876683b25595d';
const FACTORY = '0xf0fD47c2ae0D6717332602356eaAeF63C1a6c14a';
const MASTER_CHEF = '0x9083EA3756BDE6Ee6f27a6e996806FBD37F6F093';
const inSPIRIT = '0x2FBFf41a9efAEAE77538bd63f1ea489494acdc08';
const SPIRIT = '0x5Cc61A78F164885776AA610fb0FE1257df78E59B';
const MULTISIG = '0xc541896f54Ad2F0F6aF89AFd9Ea7C0c2a7F3933F';
const FEE_DISTRIBUTOR = '0x19F236eaADa7b47C1bCCD5CC6671fC247bffcC21';
const VARIABLE_BRIBE_FACTORY = '0x0bCf7B1d512379aF8d2D93358121266226De20D6';
const STABLE_BRIBE_FACTORY = '0xFc22f71708855c3c14EdE21e9C4BC91915157150';
const VARIABLE_GAUGE_PROXY = '0xd378812b9aC8158c2323d456D304AdC625740AF7';
const STABLE_GAUGE_PROXY = '0x5f43E712f2eA6292705fe0d3A038FE6a6A59A0b9';
const ADMIN_GAUGE_PROXY = '0xAa425DBE8be9c29a311D6b73d54B7bB322A784eA ';

// let FEE_DISTRIBUTOR ;
// let VARIABLE_BRIBE_FACTORY;
//let STABLE_BRIBE_FACTORY;
// let VARIABLE_GAUGE_PROXY;
// let STABLE_GAUGE_PROXY;
// let ADMIN_GAUGE_PROXY;
let minSPIRIT_GAUGE_PROXY_VARIABLE;
let minSPIRIT_GAUGE_PROXY_STABLE;
let minSPIRIT_GAUGE_PROXY_ADMIN;

const sleep = (delay) => new Promise (( resolve) => setTimeout (resolve, delay));

async function initFeeDistributor(wallet) {
  console.log('Starting FeeDistributor deployment');

  // initialize feeDistributor
  const feeDistributorArtifact = await ethers.getContractFactory("fee-distributor");
  const feeDistributorContract = await feeDistributorArtifact.deploy(inSPIRIT, "1654128000", SPIRIT, wallet, "0xc541896f54Ad2F0F6aF89AFd9Ea7C0c2a7F3933F", {
        gasPrice: ethers.gasPrice,
      });
  await feeDistributorContract.deployed();
  await sleep(5000);

  const feeDistributor = await ethers.getContractAt("fee-distributor", feeDistributorContract.address);
  console.log("- FeeDistributor Initialized at address: ", feeDistributorContract.address);
  FEE_DISTRIBUTOR = feeDistributorContract.address;
  await feeDistributor.toggle_allow_checkpoint_token({
      gasPrice: ethers.gasPrice,
    });
}

async function initVariableBribeFactory() {
  console.log('Starting Variable BribeFactory deployment');
  // initialize bribeFactory
  const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
  const bribeFactoryContract = await bribeFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  await bribeFactoryContract.deployed();
  await sleep(5000);

  // const bribeFactory = await ethers.getContractAt("BribeFactory", bribeFactoryContract.address);
  console.log("- Variable BribeFactory Initialized at address: ", bribeFactoryContract.address);
  VARIABLE_BRIBE_FACTORY = bribeFactoryContract.address;

  await hre.run("verify:verify", {
    address: VARIABLE_BRIBE_FACTORY,
    contract: "contracts/SpiritV2/Bribes.sol:BribeFactory",
  });

}

async function initStableBribeFactory() {
    console.log('Starting Stable BribeFactory deployment');
    // initialize bribeFactory
    const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
    const bribeFactoryContract = await bribeFactoryArtifact.deploy({
      gasPrice: ethers.gasPrice,
    });
    await bribeFactoryContract.deployed();
    await sleep(5000);
  
    // const bribeFactory = await ethers.getContractAt("BribeFactory", bribeFactoryContract.address);
    console.log("- Stable BribeFactory Initialized at address: ", bribeFactoryContract.address);
    STABLE_BRIBE_FACTORY = bribeFactoryContract.address;
  
    await hre.run("verify:verify", {
      address: STABLE_BRIBE_FACTORY,
      contract: "contracts/SpiritV2/Bribes.sol:BribeFactory",
    });
  
}

async function initVariableGaugeProxy() {
  console.log('Starting Variable GaugeProxy deployment');

  // initialize gaugeProxy
  const gaugeProxyArtifact = await ethers.getContractFactory("VariableGaugeProxy");
  const gaugeProxyContract = await gaugeProxyArtifact.deploy(
    MASTER_CHEF, 
    SPIRIT, 
    inSPIRIT, 
    FEE_DISTRIBUTOR, 
    VARIABLE_BRIBE_FACTORY,
    FACTORY, 
    {
        gasPrice: ethers.gasPrice,
    });
  await gaugeProxyContract.deployed();
  await sleep(5000);

  // const gaugeProxy = await ethers.getContractAt("GaugeProxy", gaugeProxyContract.address);
  console.log("- Variable GaugeProxy Initialized at address: ", gaugeProxyContract.address);
  VARIABLE_GAUGE_PROXY = gaugeProxyContract.address;

  await hre.run("verify:verify", {
      address: gaugeProxyContract.address,
      contract: "contracts/SpiritV2/VariableGaugeProxy.sol:VariableGaugeProxy",
      constructorArguments: [MASTER_CHEF, 
        SPIRIT, 
        inSPIRIT, 
        FEE_DISTRIBUTOR, 
        VARIABLE_BRIBE_FACTORY,
        FACTORY, 
      ],
    });

}

async function initStableGaugeProxy() {
    console.log('Starting Stable GaugeProxy deployment');
  
    // initialize gaugeProxy
    const gaugeProxyArtifact = await ethers.getContractFactory("StableGaugeProxy");
    const gaugeProxyContract = await gaugeProxyArtifact.deploy(
      MASTER_CHEF, 
      SPIRIT, 
      inSPIRIT, 
      FEE_DISTRIBUTOR, 
      STABLE_BRIBE_FACTORY,
      FACTORY, 
      {
          gasPrice: ethers.gasPrice,
      });
    await gaugeProxyContract.deployed();
    await sleep(5000);
  
    // const gaugeProxy = await ethers.getContractAt("GaugeProxy", gaugeProxyContract.address);
    console.log("- Stable GaugeProxy Initialized at address: ", gaugeProxyContract.address);
    STABLE_GAUGE_PROXY = gaugeProxyContract.address;

    await hre.run("verify:verify", {
        address: gaugeProxyContract.address,
        contract: "contracts/SpiritV2/StableGaugeProxy.sol:StableGaugeProxy",
        constructorArguments: [MASTER_CHEF, 
          SPIRIT, 
          inSPIRIT, 
          FEE_DISTRIBUTOR, 
          STABLE_BRIBE_FACTORY,
          FACTORY, 
        ],
      });
  
}

async function initAdminGaugeProxy() {
    console.log('Starting Admin GaugeProxy deployment');

    // initialize gaugeProxy
    const gaugeProxyArtifact = await ethers.getContractFactory("AdminGaugeProxy");
    const gaugeProxyContract = await gaugeProxyArtifact.deploy(
      MASTER_CHEF, 
      SPIRIT, 
      inSPIRIT, 
      MULTISIG, 
      FEE_DISTRIBUTOR, 
      0, 
      {
          gasPrice: ethers.gasPrice,
      });
    await gaugeProxyContract.deployed();
    await sleep(5000);
  
    // const gaugeProxy = await ethers.getContractAt("GaugeProxy", gaugeProxyContract.address);
    console.log("- Admin GaugeProxy Initialized at address: ", gaugeProxyContract.address);
  
    await hre.run("verify:verify", {
        address: gaugeProxyContract.address,
        contract: "contracts/SpiritV2/AdminGaugeProxy.sol:AdminGaugeProxy",
        constructorArguments: [MASTER_CHEF, 
          SPIRIT, 
          inSPIRIT, 
          MULTISIG, 
          FEE_DISTRIBUTOR, 
          0,
        ],
      });
}

async function verifyTokensVariableGaugeProxy() {

  const gaugeProxy = await ethers.getContractAt("VariableGaugeProxy", VARIABLE_GAUGE_PROXY);

  console.log('Starting token verification');
  const setTxn1 = await gaugeProxy.setBaseToken(FTM, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn1.wait();
  const setTxn2 = await gaugeProxy.setVerifiedToken(BTC, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn2.wait();
  const setTxn3 = await gaugeProxy.setVerifiedToken(ETH, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn3.wait();
  const setTxn4 = await gaugeProxy.setVerifiedToken(CRV, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn4.wait();
  const setTxn5 = await gaugeProxy.setVerifiedToken(LQDR, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn5.wait();
  const setTxn6 = await gaugeProxy.setVerifiedToken(BIFI, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn6.wait();

}

async function verifyTokensStableGaugeProxy() {

  const gaugeProxy = await ethers.getContractAt("StableGaugeProxy", STABLE_GAUGE_PROXY);

  console.log('Starting token verification');
  const setTxn1 = await gaugeProxy.setBaseToken(USDC, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn1.wait();
  const setTxn2 = await gaugeProxy.setVerifiedToken(DAI, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn2.wait();
  const setTxn3 = await gaugeProxy.setVerifiedToken(FRAX, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn3.wait();
  const setTxn4 = await gaugeProxy.setVerifiedToken(MIM, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn4.wait();
  const setTxn5 = await gaugeProxy.setVerifiedToken(USDT, true,
    {
    gasPrice: ethers.gasPrice,
    }
  );
  await setTxn5.wait();
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [wallet] = await ethers.getSigners();
  console.log('Using wallet: ', wallet.address);
  
    // await initFeeDistributor(wallet.address);

    // await initVariableBribeFactory();
    // await initStableBribeFactory();

    // await initVariableGaugeProxy();
    // await initStableGaugeProxy();
    // await initAdminGaugeProxy();

    // await verifyTokensVariableGaugeProxy();
    // await verifyTokensStableGaugeProxy();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });