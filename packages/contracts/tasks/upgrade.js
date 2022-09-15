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
        let [signer,] = await ethers.getSigners()
        let ins = {}
        // deploy weth
        ins.weth = await hre.run("dc", {"name": "WETH9"})
        // TT
        ins.tt = await hre.run("deployToken", {"cname": "TT", "name": "Test Token", "symbol": "TT"})

        // deploy factory
        let teleFactory = await ethers.getContractFactory("TeleswapV2Factory");
        let pFa = await upgrades.deployProxy(teleFactory, [signer.address])
        await pFa.deployed()
        ins.factory = pFa
        // deploy router
        const factory = await ethers.getContractFactory("TeleswapV2Router02");
        const proxy = await upgrades.deployProxy(factory, [ins.factory.address, ins.weth.address]);
        await proxy.deployed()
        ins.router = proxy


        // WETH-DAI, WETH-USDT, WETH-USDC
        // DAI
        ins.dai = await hre.run("deployToken", {"cname": "TT", "name": "Dai Stablecoin", "symbol": "DAI"})

        // USDC
        ins.usdc = await hre.run("deployToken", {"cname": "TT", "name": "USD Coin", "symbol": "USDC"})

        //USDT
        ins.usdt = await hre.run("deployToken", {"cname": "TT", "name": "Tether USD", "symbol": "USDT"})


        let deployed = {
            weth: ins.weth.address,
            tt: ins.tt.address,
            dai: ins.dai.address,
            usdc: ins.usdc.address,
            usdt: ins.usdt.address,
            router: ins.router.address,
            factory: ins.factory.address
        }
        console.log(deployed)
        // weth=ins.weth.address
        console.log(`weth=${deployed.weth}`)
        console.log(`tt=${deployed.tt}`)
        console.log(`dai=${deployed.dai}`)
        console.log(`usdc=${deployed.usdc}`)
        console.log(`usdt=${deployed.usdt}`)
        console.log(`router=${deployed.router}`)
        console.log(`factory=${deployed.factory}`)
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
task("dc", "deploy test token without args")
    .addParam("name", "contract name")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory(args.name);
        const fa = await factory.deploy()
        await fa.deployed();
        console.log(fa.address)
        return fa
    })

task("deployToken", "deploy test token")
    .addParam("cname", "contract name")
    .addParam("name", "token name")
    .addParam("symbol", "symbol")
    .setAction(async (args) => {
        const factory = await ethers.getContractFactory(args.cname)
        const fa = await factory.deploy(args.name, args.symbol)
        await fa.deployed()
        return fa
    })

task("buildpool", "build pool")
    .setAction(async (args) => {
        let [signer,] = await ethers.getSigners()
        console.log(`signer is ${signer.address}`)
        const router = await ethers.getContractAt("TeleswapV2Router02", process.env.router)
        const factory = await ethers.getContractAt("TeleswapV2Factory", process.env.factory)
        console.log(`WETH9 is ${process.env.weth}`)
        let weth = await ethers.getContractAt("WETH9", process.env.weth)
        let dai = await ethers.getContractAt("TT", process.env.dai)
        let usdc = await ethers.getContractAt("TT", process.env.usdc)
        let usdt = await ethers.getContractAt("TT", process.env.usdt)
        let tt = await ethers.getContractAt("TT", process.env.tt)
        console.log(`weth=${weth.address} tt=${tt.address}`)


        // usdt-weth
        const tokenAMout = ethers.utils.parseUnits("18", 18)
        const ethAmount = ethers.utils.parseUnits("1", 16)
        let routes = [
            [usdt.address, weth.address, false],
            [usdc.address, weth.address, false],
            [dai.address, weth.address, false],
        ]
        for (let i = 0; i < routes.length; i++) {
            //mint
            let token = await ethers.getContractAt("TT", routes[i][0])
            await token.mint()

            // approve
            await token.approve(router.address, tokenAMout)

            let arg = [
                [routes[i][0], weth.address, false],
                tokenAMout,
                0, 0,
                signer.address,
                getDeadline()
            ]
            // await
            await router.addLiquidityETH(...arg, {value: ethAmount})

        }
        console.log("Pair USDT-WETH ", await factory.getPair(usdt.address, weth.address, false))
        console.log("Pair USDC-WETH", await factory.getPair(usdc.address, weth.address, false))
        console.log("Pair DAI-WETH", await factory.getPair(dai.address, weth.address, false))


    })

function getDeadline() {
    return (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000) * 2
}
