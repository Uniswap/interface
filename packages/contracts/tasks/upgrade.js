// deoloy all contracts
/*
* 1. deploy weth
* 2. deoloy test token
* 3. deploy factory
* 4. deploy router
 */


task("deploy", "deploy proxy")
    .setAction(async (args, hre) => {
        if (args.weth === "") {
            console.error("weth address is required");
            return;
        }
        console.log("your blockchain network:", hre.network.name)

        let ans = {};
        // deploy weth
        ans.weth = await hre.run("dc", {"name": "WETH9"})
        // deploy test token
        ans.tt = await hre.run("dc", {"name": "ERC20"})
        // deploy factory
        let teleFactory = await ethers.getContractFactory("TeleswapV2Factory");
        let pFa = await upgrades.deployProxy(teleFactory, [process.env.PUB_KEY])
        await pFa.deployed()
        ans.factory = pFa.address
        // deploy router
        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        const proxy = await upgrades.deployProxy(factory, [ans.factory, ans.weth]);
        await proxy.deployed()
        ans.router = proxy.address


        console.log("deployed:", ans)
    })

// upgrade
task("upgradeRouter", "upgrade router")
    .addParam("prouter", "proxy address of factory")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        await upgrades.upgradeProxy(args.prouter, factory);
        console.log("router implement upgraded");
    })

task("upgradeFactory", "upgrade factory")
    .addParam("pfactory", "proxy address of factory")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory("TeleswapV2Factory");
        await upgrades.upgradeProxy(args.pfactory, factory);
        console.log("factory implement upgraded");
    })

// upgrade factory & router
task("upgrade", "upgrade proxy & router")
    .addParam("pfactory", "proxy address of factory")
    .addParam("prouter", "router address of factory")
    .setAction(async (args, hre) => {
        await hre.run("upgradeFactory", {"pfactory": args.pfactory})
        await hre.run("upgradeRouter", {"prouter": args.prouter})
    })


// deploy contract
task("dc", "deploy test token").setAction(async (args) => {
    const factory = await ethers.getContractFactory(args.name);
    const fa = await factory.deploy()
    await fa.deployed();
    return fa.address
})
