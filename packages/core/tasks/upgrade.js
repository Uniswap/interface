task("deploy", "deploy proxy").setAction(async () => {
    const factory = await ethers.getContractFactory("TeleswapV2Factory");
    console.log("signer address: ", factory.signer.address)
    const proxy = await upgrades.deployProxy(factory, [process.env.PUB_KEY]);
    await proxy.deployed()
    console.log("proxy address is:", proxy.address);
})

task("upgrade", "upgrade proxy")
    .addParam("factoryproxy", "proxy address of factory")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory("TeleswapV2Factory");
        const proxy = await upgrades.upgradeProxy(args.factoryproxy, factory);
        console.log("factory implement upgraded");
    })