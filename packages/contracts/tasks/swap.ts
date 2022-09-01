import "@nomiclabs/hardhat-web3"
import {subtask, task, types} from "hardhat/config"
import {BigNumber, ethers, utils} from "ethers";
// @ts-ignore
import TeleswapV2Pair from '../abi/TeleswapV2Pair.json'
import {asArray, getMessage, TypedData} from "eip-712";
require('dotenv').config()

/**
 *
 * hh deployToken --network opg
 *
 * export ERC20_TOKEN_01=0x960203b9c264823b1d520418b78ff18325444305 tt
 * export WETH9_TOKEN_02=0x33e831a5cb918a72065854e6085bdbd7ea5c2c45 WETH9
 * hh deployToken --network rinkeby
 */
// 部署合约并获取token对
task("deployToken", "Deploy Token")
    .setAction(async (taskArgs, hre) => {
        const tokenFactory = await hre.ethers.getContractFactory('ERC20')
        const token = await tokenFactory.deploy()
        await token.deployed();
        console.log("export ERC20_TOKEN_01=%s", token.address.toLocaleLowerCase())
        const tokenFactory01 = await hre.ethers.getContractFactory('WETH9')
        const token01 = await tokenFactory01.deploy()
        await token01.deployed();
        console.log("export WETH9_TOKEN_02=%s", token01.address.toLocaleLowerCase())
    });



/**
 * 部署task新的网络需要部署，部署好后直接使用就好
 *
 * hh deploySwapAll --factoryaddress 0x91ca2eeead12c7de23461d49f1dd1b9e7bd61506 --wethaddress 0x33e831a5cb918a72065854e6085bdbd7ea5c2c45 --network bitnetwork
 */
task("deploySwapAll", "Deploy Token")
    .addParam("factoryaddress", "factoryaddress合约地址")
    .addParam("wethaddress", "wethaddress合约地址")
    .setAction(async (taskArgs, hre) => {
        const uniswapV2Router02 = await hre.ethers.getContractFactory('UniswapV2Router02')
        const contractsAddress = await uniswapV2Router02.deploy(taskArgs.factoryaddress,taskArgs.wethaddress)
        await contractsAddress.deployed();
        console.log("export uniswapV2Router02Address=%s", contractsAddress.address.toLocaleLowerCase())
    });

/**
 * hh deploySlidingWindowOracle --windowsize 24 --granularity 24 --factoryaddress 0x75866fdc1fe08cc5c6742b2f447a3a87007e5c7d --network rinkeby
 * export exampleSlidingWindowOracle=0x298ef379936eecf0e4027b4fbd0b1e50fffeccbf
 */
task("deploySlidingWindowOracle", "滑动窗口预言机部署")
    .addParam("windowsize", "windowSize窗口数量")
    .addParam("factoryaddress", "factoryaddress合约地址")
    .addParam("granularity", "granularity分片大小")
    .setAction(async (taskArgs, hre) => {
        const exampleSlidingWindowOracle = await hre.ethers.getContractFactory('ExampleSlidingWindowOracle')
        const contractsAddress = await exampleSlidingWindowOracle.deploy(taskArgs.factoryaddress,taskArgs.windowsize,taskArgs.granularity)
        await contractsAddress.deployed();
        console.log("export exampleSlidingWindowOracle=%s", contractsAddress.address.toLocaleLowerCase())
    });


/**
 *
 * hh deployMulticall --network bitnetwork
 */
task("deployMulticall", "deployMulticall")
    .setAction(async (taskArgs, hre) => {
        const multicall = await hre.ethers.getContractFactory('Multicall')
        const contractsAddress = await multicall.deploy()
        await contractsAddress.deployed();
        console.log("export multicall=%s", contractsAddress.address.toLocaleLowerCase())
    });


/**
 * hh updateWindow --token01 0xf5e5b77dd4040f5f4c2c1ac8ab18968ef79fd6fe --token02 0xd7c3cc3bcbac0679eae85b40d985ac5a8d4b0092 --slidingwindoworacle 0x298ef379936eecf0e4027b4fbd0b1e50fffeccbf --network rinkeby
 */
task("updateWindow", "updateWindow")
    .addParam("token01", "token01")
    .addParam("token02", "token01")
    .addParam("slidingwindoworacle", "slidingWindowOracle合约地址")
    .setAction(async (taskArgs, hre) => {
        const exampleSlidingWindowOracle = await hre.ethers.getContractFactory('ExampleSlidingWindowOracle')
        const slidingWindowOracleContracts = await exampleSlidingWindowOracle.attach(taskArgs.slidingwindoworacle)
        const updateWindowOracleData: [string,string] = [
            taskArgs.token01,
            taskArgs.token02
        ]
        console.log("updateWindowOracleData=%s", updateWindowOracleData)
        let updateWindowOracleDataRes= await slidingWindowOracleContracts.update(...updateWindowOracleData)
        console.log("export updateWindowOracleDataRes=%s", updateWindowOracleDataRes)
    });


/**
 * hh getConsult --tokenin 0x5444548282666a1Cf54698445cc98CB9b6B73831 --tokenout 0xd5f61c8786c71a2A0C80F6fC405814952AEE7696 --amountin 4000000 --slidingwindoworacle 0x298ef379936eecf0e4027b4fbd0b1e50fffeccbf --network rinkeby
 */
task("getConsult", "获取Consult")
    .addParam("tokenin", "输入token")
    .addParam("tokenout", "输出token")
    .addParam("slidingwindoworacle", "slidingWindowOracle合约地址")
    .addParam("amountin", "输入金额")
    .setAction(async (taskArgs, hre) => {
        const exampleSlidingWindowOracle = await hre.ethers.getContractFactory('ExampleSlidingWindowOracle')
        const slidingWindowOracleContracts = await exampleSlidingWindowOracle.attach(taskArgs.slidingwindoworacle)
        const slidingWindowOracleData: [string,bigint,string] = [
            taskArgs.tokenin,
            taskArgs.amountin,
            taskArgs.tokenout
        ]
        console.log("slidingWindowOracleData=%s", slidingWindowOracleData)
        let  slidingWindowOracleDataRes= await slidingWindowOracleContracts.consult(...slidingWindowOracleData)
        console.log("export slidingWindowOracleDataRes=%s", slidingWindowOracleDataRes)
    });


/**
 * getAmountsOut
 * hh getAmountsOut --amountin 10 --token1 0x3D810bB0feDdCE224E3E1903B4629AB113EF9523 --token2 0xD1A52D3DF694CFc3f3171e8F4345539EF46A7D72 --router02address 0x548001f9a76aCC1e8ba5aAf86f9777d414b02bbf --network opg
 */
// 查询金额可兑换额度
task("getAmountsOut", "getAmountsOut")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("router02address", "TeleswapV2Router02.sol合约地址")
    .addParam("amountin", "输入金额")
    .addParam("stable", "# 兑换方式 false->volatile true->stableswap",false,types.boolean)
    .setAction(async (taskArgs, hre) => {
        const teleswapV2Router02 = await hre.ethers.getContractFactory('TeleswapV2Router02')
        const router02address = await teleswapV2Router02.attach(taskArgs.router02address)
        let amountIn = expandTo18Decimals(taskArgs.amountin)
        let routes = [{
            from   :   taskArgs.token1,
            to:       taskArgs.token2,
            stable:   taskArgs.stable
        }]
        console.log("export route=%s", JSON.stringify(routes))
        let getAmountsOutRes= await router02address.getAmountsOut(amountIn,routes)
        console.log("volatile getAmountsOutRes:", getAmountsOutRes.map((item: ethers.BigNumberish) => ethers.utils.formatEther(item)))
    });

// 查询ERC20合约 token的余额
task("qBalancesERC20", "查询余额或者代币余额")
    .addParam("token", "代币地址", "")
    .addParam("wallet", "待查询的钱包地址")
    .setAction(async (taskArgs, hre) => {
        let balances: string

        // 若果是address(0)，则直接查询余额
        if (taskArgs.token === "" ||
            taskArgs.token === "0x0000000000000000000000000000000000000000") {
            balances = await hre.web3.eth.getBalance(taskArgs.wallet)
        } else {
            // 查询代币余额
            const tokenFactory = await hre.ethers.getContractFactory('ERC20')
            const token = await tokenFactory.attach(taskArgs.token)

            balances = (await token.balanceOf(taskArgs.wallet)).toString()
        }

        console.log("balance: ", balances)
        console.log("time: ", (new Date()).valueOf())
    });

// 查询WETH合约 token的余额
task("qBalancesWETH", "查询余额或者代币余额")
    .addParam("token", "代币地址", "")
    .addParam("wallet", "待查询的钱包地址")
    .setAction(async (taskArgs, hre) => {
        let balances: string

        // 若果是address(0)，则直接查询余额
        if (taskArgs.token === "" ||
            taskArgs.token === "0x0000000000000000000000000000000000000000") {
            balances = await hre.web3.eth.getBalance(taskArgs.wallet)
        } else {
            // 查询代币余额
            const tokenFactory = await hre.ethers.getContractFactory('WETH9')
            const token = await tokenFactory.attach(taskArgs.token)

            balances = (await token.balanceOf(taskArgs.wallet)).toString()
        }

        console.log("balance: ", balances)
        console.log("time: ", (new Date()).valueOf())
    });



// 查询 ERC20合约token的Allowance
task("qAllowanceERC20", "查询允许调用的额度")
    .addParam("token", "代币地址")
    .addParam("router02", "被授权的router02合约地址")
    .addParam("wallet", "授权的钱包地址")
    .setAction(async (taskArgs, hre) => {
        const tokenFactory = await hre.ethers.getContractFactory('ERC20')
        const token = await tokenFactory.attach(taskArgs.token)

        let allowances = (await token.allowance(taskArgs.wallet, taskArgs.router02))

        console.log("allowances: ", allowances)
        console.log("time: ", (new Date()).valueOf())
    });

// 查询 WETH合约token的Allowance
task("qAllowanceWETH", "查询允许调用的额度")
    .addParam("token", "代币地址")
    .addParam("router02", "被授权的router02合约地址")
    .addParam("wallet", "授权的钱包地址")
    .setAction(async (taskArgs, hre) => {
        const tokenFactory = await hre.ethers.getContractFactory('WETH9')
        const token = await tokenFactory.attach(taskArgs.token)

        let allowances = (await token.allowance(taskArgs.wallet, taskArgs.router02))

        console.log("allowances: ", allowances)
        console.log("time: ", (new Date()).valueOf())
    });

/**
 *
 * hh rApproveERC20 --token 0x1E0600188690F46aC97674ae922f73a1948a346b --router02 0x87f3C84Fc7a6f9361Dc6865984D03D1156522A9c --amount 98765432100000000000 --network opg
 */
// ERC20 授权额度查询
task("rApproveERC20", "授权调用额度")
    .addParam("token", "代币地址")
    .addParam("router02", "被授权的router02合约地址")
    .addParam("amount", "金额")
    .setAction(async (taskArgs, hre) => {
        const tokenFactory = await hre.ethers.getContractFactory('ERC20')
        const token = await tokenFactory.attach(taskArgs.token)

        let transaction = await token.approve(taskArgs.router02, taskArgs.amount)

        console.log("approve txHash: ", transaction.hash)
        console.log("time: ", (new Date()).valueOf())
    });

/**
 *
 * hh rApproveWETH --token 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB --router02 0x87f3C84Fc7a6f9361Dc6865984D03D1156522A9c --amount 98765432100000000000 --network opg
 */
// WETH 授权额度查询
task("rApproveWETH", "授权调用额度")
    .addParam("token", "代币地址")
    .addParam("router02", "被授权的router02合约地址")
    .addParam("amount", "金额")
    .setAction(async (taskArgs, hre) => {
        const tokenFactory = await hre.ethers.getContractFactory('WETH9')
        const token = await tokenFactory.attach(taskArgs.token)

        let transaction = await token.approve(taskArgs.router02, taskArgs.amount)

        console.log("approve txHash: ", transaction.hash)
        console.log("time: ", (new Date()).valueOf())
    });

/**
 * 5000000000,2000000000
 * 部署task新的网络需要部署，部署好后直接使用就好,注意token的精读
 * hh addLiquidity --token1 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB --token2 0x1E0600188690F46aC97674ae922f73a1948a346b --amount1desired 5000000000000000000 --amount2desired 5000000000000000000 --amount1min 0 --amount2min 0 --to 0xD6f15EAC1Cb3B4131Ab4899a52E711e19DEeA73f --router02address 0x87f3C84Fc7a6f9361Dc6865984D03D1156522A9c --network opg
 */
// ERC20 添加liquidity
// Allowance中需要始终保持有额度，否则将影响后续操作
task("addLiquidity", "增加流通性")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("amount1desired", "amount1desired")
    .addParam("amount2desired", "amount2desired")
    .addParam("amount1min", "amount1min")
    .addParam("amount2min", "amount2min")
    .addParam("to", "to，一般为调用者钱包地址")
    .addParam("router02address", "TeleswapV2Router02合约地址")
    .addParam("stable", "# 兑换方式 false->volatile true->stableswap",false,types.boolean)
    .setAction(async (taskArgs, hre) => {
            const teleswapV2Router02 = await hre.ethers.getContractFactory('TeleswapV2Router02')
            const router02address = await teleswapV2Router02.attach(taskArgs.router02address)
            let date1 =Math.round((new Date().getTime()+3600000)/1000)
            let route= {
                    from:  taskArgs.token1,
                    to: taskArgs.token2,
                    stable:taskArgs.stable
                }
            let addLiquidityRes= await router02address.addLiquidity(route,
                taskArgs.amount1desired,
                taskArgs.amount2desired,
                taskArgs.amount1min,
                taskArgs.amount2min,
                taskArgs.to,
                date1.valueOf())
            console.log("addLiquidityRes->hash=%s", addLiquidityRes.hash)
    });


/**
 * 5000000000,2000000000
 * 部署task新的网络需要部署，部署好后直接使用就好,注意token的精读
 * hh addLiquidityEth --token1 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB --token2 0x1E0600188690F46aC97674ae922f73a1948a346b --amount1desired 5000000 --amount2desired 5000000 --amount1min 0 --amount2min 0 --to 0xD6f15EAC1Cb3B4131Ab4899a52E711e19DEeA73f --router02address 0x87f3C84Fc7a6f9361Dc6865984D03D1156522A9c --network opg
 */
// WETH 增加liquidity
task("addLiquidityEth", "增加流通性")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("amounttokendesired", "amountTokenDesired")
    .addParam("amounttokenmin", "amountTokenMin")
    .addParam("amountethmin", "amountETHMin")
    .addParam("to", "to，一般为调用者钱包地址")
    .addParam("router02address", "TeleswapV2Router02合约地址")
    .addParam("stable", "# 兑换方式 false->volatile true->stableswap",false,types.boolean)
    .setAction(async (taskArgs, hre) => {
        const teleswapV2Router02 = await hre.ethers.getContractFactory('TeleswapV2Router02')
        const router02address = await teleswapV2Router02.attach(taskArgs.router02address)
        let date1 =Math.round((new Date().getTime()+3600000)/1000)
        let route= {
            from:  taskArgs.token1,
            to: taskArgs.token2,
            stable:taskArgs.stable
        }
        let addLiquidityRes= await router02address.addLiquidityETH(route,
            taskArgs.amounttokendesired,
            taskArgs.amounttokenmin,
            taskArgs.amountethmin,
            taskArgs.to,
            date1.valueOf())
        console.log("addLiquidityRes->hash=%s", addLiquidityRes.hash)
    });

/**
 * 50,00000000,20,00000000
 * 注意token的精读 代币替换代币
 * hh swapExactTokensForTokens --token1 0x5444548282666a1Cf54698445cc98CB9b6B73831 --token2 0xd5f61c8786c71a2A0C80F6fC405814952AEE7696  --amountin 1 --amountoutmin 1 --to 0xD6f15EAC1Cb3B4131Ab4899a52E711e19DEeA73f  --router02address 0x5C3A929Fe2F96F6767830e73375AE59cdd020447 --network opg
 */
// 执行swap
// amountin 是有增加系数的， 1≠1
task("swapExactTokensForTokens", "swapExactTokensForTokens")
    .addParam("amountin", "使用金额")
    .addParam("amountoutmin", "最低到账金额")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("to", "to，钱包地址")
    .addParam("router02address", "uniswapV2Router02Address合约地址")
    .addParam("stable", "# 兑换方式 false->volatile true->stableswap",false,types.boolean)
    .setAction(async (taskArgs, hre) => {
        let date1 =Math.round((new Date().getTime()+3600000)/1000)
        const teleswapV2Router02 = await hre.ethers.getContractFactory('TeleswapV2Router02')
        const router02address = await teleswapV2Router02.attach(taskArgs.router02address)
        let route= [
            taskArgs.token1,
            taskArgs.token2,
            taskArgs.stable
        ]
        let amountIn = expandTo18Decimals(taskArgs.amountin)
        const swapExactTokensForTokensData: [BigNumber,bigint,any[],string,number] = [
            amountIn,
            taskArgs.amountoutmin,
            new Array(route),
            taskArgs.to,
            date1.valueOf(),
        ]
        let swapExactTokensForTokensRes= await router02address.swapExactTokensForTokens(...swapExactTokensForTokensData)
        console.log("swapExactTokensForTokens->hash=%s", swapExactTokensForTokensRes.hash)
    });

/**
 * 50,00000000,20,00000000
 * 注意token的精度 removeLiquidityWithPermit 取消消除流动性
 * hh removeLiquidityWithPermit --pairaddress 0x395E10137bA69D941E5acC5A287398f949Cc7109 --privatekey 7eefd641410560e690736ee331bd32512c9b58419a877eff2189facbef33cd1e --token2 0x5e19ed03cea5bbf12939d3cc096f5597b91fcf8a --token1 0x40429f9578811b7ca3a1e806784bbdd50a9a3b5b --liquidity 499999000 --amountamin 593998812 --amountbmin 412705528 --to 0xD6f15EAC1Cb3B4131Ab4899a52E711e19DEeA73f  --router02address 0xcf5716e86273a0f53fe6ad6f37abdbe8680f2a2f --network bitnetwork
 */
// remove 池子
task("removeLiquidityWithPermit", "removeLiquidityWithPermit 取消消除流动性")
    .addParam("liquidity", "流动性")
    .addParam("amountamin", "amountamin")
    .addParam("amountbmin", "amountbmin")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("to", "to，钱包地址")
    .addParam("router02address", "uniswapV2Router02Address合约地址")
    .addParam("privatekey", "签名私钥")
    .addParam("pairaddress", "token对应的pairaddress合约地址")
    .setAction(async (taskArgs, hre) => {
        const uniswapV2Router02 = await hre.ethers.getContractFactory('UniswapV2Router02')
        const router02address = await uniswapV2Router02.attach(taskArgs.router02address)

        let url = "https://goerli.optimism.io";
        let customHttpProvider = new ethers.providers.JsonRpcProvider(url);
        let wallet = new hre.ethers.Wallet(taskArgs.privatekey, customHttpProvider);
        const pair =new hre.ethers.Contract(taskArgs.pairaddress, TeleswapV2Pair, wallet)
        let  nonce =await pair.nonces(wallet.address)
        let date1 =Math.round((new Date().getTime()+3600000)/1000)
        const typedData: TypedData = {
             types :{
                EIP712Domain: [
                    {name: 'name', type: 'string'},
                    {name: 'version', type: 'string'},
                    {name: 'chainId', type: 'uint256'},
                    {name: 'verifyingContract', type: 'address'},
                ],
                Permit: [
                    {name: 'owner', type: 'address'},
                    {name: 'spender', type: 'address'},
                    {name: 'value', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'deadline', type: 'uint256'}
                ]
            },
            primaryType: 'Permit',
            domain : {
                name:  'Teleswap V2',
                version: '1',
                chainId: 420,
                verifyingContract: taskArgs.pairaddress
            },
            message : {
                owner: wallet.address,
                spender: taskArgs.router02address,
                value: taskArgs.liquidity,
                nonce: nonce.toNumber(),
                deadline: date1.valueOf()
            }
        };
        const signingKey = new utils.SigningKey(wallet.privateKey);
       // Get a signable message from the typed data
        const message = getMessage(typedData, true);
       // Sign the message with the private key
        const { r, s, v } = signingKey.signDigest(message);
        console.info(`typedData-data:`,typedData)

        const removeLiquidityWithPermitData: [string,string,string,string,string,string,number,boolean,number,string,string] = [
            taskArgs.token1,
            taskArgs.token2,
            taskArgs.liquidity,
            taskArgs.amountamin.toString(),
            taskArgs.amountbmin.toString(),
            taskArgs.to,
            date1.valueOf(),
            false,
            v,
            r,
            s
        ]
        let removeLiquidityWithPermitRes= await router02address.removeLiquidityWithPermit(...removeLiquidityWithPermitData)
        console.log("removeLiquidityWithPermitRes->hash=%s", removeLiquidityWithPermitRes.hash)
    });

/**
 *
 * hh mint --erc20address 0xd5f61c8786c71a2A0C80F6fC405814952AEE7696 --network opg
 * hh mint --erc20address 0x960203b9c264823b1d520418b78ff18325444305 --network rinkeby
 */
// mint操作不需要指定to及金额，合约中写死了
task("mint", "mint 初始化")
    .addParam("erc20address", "erc20address合约地址")
    .setAction(async (taskArgs, hre) => {
        const erc20 = await hre.ethers.getContractFactory('ERC20')
        const uniswapV2 = await erc20.attach(taskArgs.erc20address)
        let mintRes =await uniswapV2.mint()
        console.log("mintRes:",mintRes)
    });

/**
 *
 * hh mintWETH --wethaddress 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB --network opg
 * hh mintWETH --wethaddress 0x33e831a5cb918a72065854e6085bdbd7ea5c2c45 --network rinkeby
 */
task("mintWETH", "mint 初始化")
    .addParam("wethaddress", "wethaddress合约地址")
    .setAction(async (taskArgs, hre) => {
        const erc20 = await hre.ethers.getContractFactory('WETH9')
        const uniswapV2 = await erc20.attach(taskArgs.wethaddress)
        let mintRes =await uniswapV2.mint()
        console.log("mintRes:",mintRes)
    });

/**
 * export pairInitCodeHash=0x1ee787dd500ff0ddafab339d616b981c1711abc5a7bd7f187bd82c15ec518258
 * hh getFactoryInitCode --factoryaddress 0x4f9cfa00a70489f80162960b06908538ea1dffd2 --network rinkeby
 * export pairInitCodeHash=0x0849561beeae80e10e387edae371fa9302e24cdefac26d4c95a570928c4b32c6
 * hh getFactoryInitCode --factoryaddress 0x91ca2eeead12c7de23461d49f1dd1b9e7bd61506 --network bitnetwork
 */
task("getFactoryInitCode", "getFactoryInitCode")
    .addParam("factoryaddress", "uniswapV2Factory合约地址")
    .setAction(async (taskArgs, hre) => {
        const uniswapV2Factory = await hre.ethers.getContractFactory('UniswapV2Factory')
        const uniswapV2 = await uniswapV2Factory.attach(taskArgs.factoryaddress)
        console.log("export pairInitCodeHash=%s",await uniswapV2.pairInitCodeHash())
    });

/**
 * hh getPair --factoryaddress 0xDE15CBA96deAD6Bdd201aa27fc19e15F2bAB6D02 --token1 0x4E283927E35b7118eA546Ef58Ea60bfF59E857DB --token2 0x1E0600188690F46aC97674ae922f73a1948a346b --network opg
 * export getPair=0x395E10137bA69D941E5acC5A287398f949Cc7109
 * */
task("getPair", "getPair")
    .addParam("token1", "token1")
    .addParam("token2", "token2")
    .addParam("factoryaddress", "uniswapV2Factory合约地址")
    .addParam("stable", "# 兑换方式 false->volatile true->stableswap",false,types.boolean)
    .setAction(async (taskArgs, hre) => {
        const teleswapV2Factory = await hre.ethers.getContractFactory('TeleswapV2Factory')
        const uniswapV2 = await teleswapV2Factory.attach(taskArgs.factoryaddress)
        const getPairData: [string,string,boolean] = [
            taskArgs.token1,
            taskArgs.token2,
            taskArgs.stable
        ]
        console.log("export getPair=%s",await uniswapV2.getPair(...getPairData))
    });

/**
 * export ERC20_TOKEN_02=0xdb15d02b15918e0a0bdbfde45857b096e7c36a61 tw
 * export ERC20_TOKEN_02=0x74203043c8191893579fe0f797694364a791df65 cf
 * hh qDecimals --token 0xf5e5b77dd4040f5f4c2c1ac8ab18968ef79fd6fe --network rinkeby
 */
task("qDecimals", "查询ERC20合约的decimal")
    .addParam("token", "代币地址")
    .setAction(async (taskArgs, hre) => {
        // 链接合约
        const tokenFactory = await hre.ethers.getContractFactory('ERC20')
        const token = await tokenFactory.attach(taskArgs.token)

        const name = await token.name()
        const decimals = await token.decimals()
        const symbol = await token.symbol()
        const totalSupply = await token.totalSupply()

        console.log("token name: ", name)
        console.log("token decimals: ", decimals)
        console.log("token symbol: ", symbol)
        console.log("token totalSupply: ", totalSupply.toString())
        console.log("time: ", (new Date()).valueOf())
    });

/**
 * getReserves
 * hh getReserves --pairaddress 0x395E10137bA69D941E5acC5A287398f949Cc7109 --network opg
 */
task("getReserves", "allPairs")
    .addParam("pairaddress", "pairaddress合约地址")
    .setAction(async (taskArgs, hre) => {
        const uniswapV2Factory = await hre.ethers.getContractFactory('TeleswapV2Pair')
        const uniswapV2 = await uniswapV2Factory.attach(taskArgs.pairaddress)
        let reserves= await uniswapV2.getReserves()
        console.log("getReserves->",reserves)
    });


/**
 * hh getHash --hash 0x6ee8ae7c6a0f4a54fa8f6d5736c16ec5d8206c37a51f84f0b6fdf034ee35192c --network opg
 */
// 交易hash详情
task("getHash","获取交易凭证信息")
    .addParam("hash", "交易hash")
    .setAction(async(taskArgs,hre)=>{
        let transaction = await hre.web3.eth.getTransaction(taskArgs.hash)

        if (transaction.blockNumber!) {
            let transactionReceipt = await hre.web3.eth.getTransactionReceipt(taskArgs.hash)
            let block = await hre.web3.eth.getBlock(transaction.blockNumber!)
            console.log("block timestamp: ", block.timestamp)
            console.log("blockHash: ", transaction.blockHash)
            console.log("blockNumber: ", transaction.blockNumber)
            console.log("status: ", transactionReceipt.status)
            console.log("cumulativeGasUsed: ", transactionReceipt.cumulativeGasUsed)
            console.log("contractAddress: ", transactionReceipt.contractAddress)
            // console.log("transactionReceipt: ",transactionReceipt)
        }
        console.log("time: ", (new Date()).valueOf())
    });

function expandTo18Decimals(n: string) {
    return BigNumber.from(n).mul(BigNumber.from("10").pow(18))
}
module.exports = {}

