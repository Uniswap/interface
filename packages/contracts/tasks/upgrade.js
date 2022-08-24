// deoloy router by proxy
task("deploy", "deploy proxy")
    .addParam("teleswapfactory", "teleswapfactory address")
    .addParam("weth", "weth address")
    .setAction(async (args) => {
        if (args.weth === "") {
            console.error("weth address is required");
            return;
        }

        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        console.log("Signer Address: ", factory.signer.address);
        const proxy = await upgrades.deployProxy(factory, [args.teleswapfactory, args.weth], {
            gasLimit: 4000000
        });
        await proxy.deployed()
        console.log("proxy address is:", proxy.address);
    })

// upgrade router
task("upgrade", "upgrade proxy")
    .addParam("factoryproxy", "proxy address of factory")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        await upgrades.upgradeProxy(args.factoryproxy, factory);
        console.log("router implement upgraded");
    })

// depoly weth
task("dweth", "deploy factory").setAction(async (args) => {
    const factory = await ethers.getContractFactory("WETH9");
    const fa = await factory.deploy()
    await fa.deployed();
    console.log("weth address is:", fa.address);
})