task("call", "add liquidity").setAction(async (args) => {
    const factory = await ethers.getContractFactory(args.name);
    const fa = await factory.deploy()
    await fa.deployed();
    return fa.address
})

task("minttoken", "approve tt & weth token of fixed amount to router  ,and it will be muled 1e18")
    .setAction(async (args, hre) => {

        let ans = await getFactorys()
        await ans.tt.mint()
        await ans.weth.mint()
    })

task("approverouter", "approve tt & weth token of fixed amount to router  ,and it will be muled 1e18")
    .addParam("amount", "")
    .setAction(async (args) => {
        let ans = await getFactorys()

        let xamount = expandTo18Decimals(args.amount)
        await ans.tt.approve(ans.router.address, xamount)
        await ans.weth.approve(ans.router.address, xamount)
        console.log("weth allowence", await ans.weth.allowance(ans.signer.address, ans.router.address))
    })

task("addLiquidity", "only for weth-tt pair")
    .addParam("stable", "0 for volitale,1 for stable")
    .setAction(async (args) => {
        let stable = args.stable === "1"
        let amount = 1000000000
        let ans = await getFactorys()
        console.log(ans.signer.address)
        let arg = [
            [ans.weth.address, ans.tt.address, stable],
            amount,
            amount,
            1,
            1,
            ans.signer.address,
            (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
        ]
        console.log("reserve before", await ans.pair.getReserves())
        await ans.router.addLiquidity(...arg)
        // check liquidity
        console.log("reserve after", await ans.pair.getReserves())
    })

task("calcpair", "")
    .setAction(async (args) => {
        let ans = await getFactorys()
        let pairAddr = await ans.factory.getPair(ans.weth.address, ans.tt.address, false)

        let {address0, address1} = ans.weth.address < ans.tt.address ? {
            address0: ans.weth.address,
            address1: ans.tt.address
        } : {address0: ans.tt.address, address1: ans.weth.address}
        let initCodeHash = ethers.utils.keccak256((await ethers.getContractFactory("TeleswapV2Pair")).bytecode)
        let salt = await ethers.utils.solidityKeccak256(['address', 'address', 'bool'], [address0, address1, false])
        let calcedAddress = await ethers.utils.getCreate2Address(ans.factory.address, salt, initCodeHash)
        console.log("calced address", calcedAddress)
        console.log("volatile pair addr", pairAddr)
    })


// test case run on testnet
async function getFactorys() {
    return {
        factory: await (await ethers.getContractFactory("TeleswapV2Factory")).attach(process.env.factory),
        router: await (await ethers.getContractFactory("TeleswapV2Router02")).attach(process.env.router),
        weth: await (await ethers.getContractFactory("WETH9")).attach(process.env.weth),
        tt: await (await ethers.getContractFactory("TT")).attach(process.env.tt),
        signer: (await ethers.getSigners())[0]
    }
}


function expandTo18Decimals(n) {
    return ethers.BigNumber.from(n).mul(ethers.BigNumber.from("10").pow(18))
}