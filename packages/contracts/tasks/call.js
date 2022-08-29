


task("call", "add liquidity").setAction(async (args) => {
    const factory = await ethers.getContractFactory(args.name);
    const fa = await factory.deploy()
    await fa.deployed();
    return fa.address
})

task("date","").setAction(async (args) => {
    console.log(Math.floor(Date.now() / 1000))
})

