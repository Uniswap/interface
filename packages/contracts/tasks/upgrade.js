// deoloy all contracts
/*
* 1. deploy weth
* 2. deoloy test token
* 3. deploy factory
* 4. deploy router
 */


task("deploy", "deploy proxy")
    .setAction(async (args, hre) => {
        console.log("your blockchain network:", hre.network.name)

        let ins = {}
        // deploy weth
        ins.weth = await hre.run("dc", {"name": "WETH9"})
        // deploy test token
        ins.tt = await hre.run("dc", {"name": "TT"})
        // deploy factory
        let teleFactory = await ethers.getContractFactory("TeleswapV2Factory");
        let pFa = await upgrades.deployProxy(teleFactory, [process.env.PUB_KEY])
        await pFa.deployed()
        ins.factory = pFa
        // deploy router
        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        const proxy = await upgrades.deployProxy(factory, [ins.factory.address, ins.weth.address]);
        await proxy.deployed()
        ins.router = proxy

        console.log({
            weth:ins.weth.address,
            tt:ins.tt.address,
            router:ins.router.address,
            factory:ins.factory.address

        })
        return ins
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
task("dc", "deploy test token")
    .addParam("name", "contract name")
    .setAction(async (args) => {
    const factory = await ethers.getContractFactory(args.name);
    const fa = await factory.deploy()
    await fa.deployed();
    console.log(fa.address)
    return fa
})
