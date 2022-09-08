const {expect} = require("chai");
const hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {sign} = require("ethereumjs-util/dist/secp256k1v3-adapter");

const ethers = hre.ethers
const BigNumber = ethers.BigNumber
describe('Router02', function () {
    const decimals18 = 18

    async function deployContracts() {
        let ans = await hre.run("deploy")
        const approveAmount = expandTo18Decimals(1e4)
        let weth = ans.weth
        let tt = ans.tt
        let factory = ans.factory
        let router = ans.router

        await weth.mint()
        await weth.approve(router.address, expandTo18Decimals(approveAmount))
        await tt.mint()
        await tt.approve(router.address, expandTo18Decimals(approveAmount))


        let args = [
            [weth.address, tt.address],
            expandTo18Decimals(10),
            expandTo18Decimals(8),
            1,
            1,
            (await ethers.getSigners())[0].address,
           getDeadline()
        ]
        await router.addLiquidity(...args)
        let pair = await factory.getPair(weth.address, tt.address, false)
        pair = await (await ethers.getContractFactory("TeleswapV2Pair")).attach(pair)

        let argsStable = [
            [weth.address, tt.address, true],
            expandTo18Decimals(10),
            expandTo18Decimals(8),
            1,
            1,
            (await ethers.getSigners())[0].address,
            getDeadline()
        ]
        await router.addLiquidity(...argsStable)
        let pairStable = await factory.getPair(weth.address, tt.address, true)
        pairStable = await (await ethers.getContractFactory("TeleswapV2Pair")).attach(pairStable)
        const signer = (await ethers.getSigners())[0]

        await signer.sendTransaction(
            {
                to: weth.address,
                value: expandTo18Decimals(100)
            }
        )

        ans.pair = pair
        ans.pairStable = pairStable
        ans.signer = signer

        return ans
    }

    describe('calc logic', function () {
        it("getAmountOut", async function () {
            const ans = await loadFixture(deployContracts);

            let router = ans.router

            let reserveIn = expandTo18Decimals("100"), reserveOut = expandTo18Decimals("100"),
                amountIn = expandTo18Decimals("10")
            let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            console.log("volatile desireAmountOut without fee:", ethers.utils.formatEther(desireAmountOut))

            // volatile
            let calcAmount = await router.getAmountOut(amountIn, reserveIn, reserveOut, false, decimals18, decimals18)
            console.log("volatile calcAmount:", ethers.utils.formatEther(calcAmount))
            // stable
            calcAmount = await router.getAmountOut(amountIn, reserveIn, reserveOut, true, decimals18, decimals18)
            console.log("stable calcAmount:", ethers.utils.formatEther(calcAmount))

        });

        it("getAmountsOut", async function () {
            const ans = await loadFixture(deployContracts);

            const weth = ans.weth
            const tt = ans.tt
            const router = ans.router
            const pair = ans.pair
            let token0 = await pair.token0()
            let [reserve0, reserve1] = await pair.getReserves()
            let reserveIn, reserveOut
            if (token0 === weth.address) {
                [reserveIn, reserveOut] = [reserve0, reserve1]
            } else {
                [reserveIn, reserveOut] = [reserve1, reserve0]
            }
            let amountIn = expandTo18Decimals("10")

            let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            console.log("volatile desireAmountOut without fee:", ethers.utils.formatEther(desireAmountOut))

            // volatile
            let args = [
                amountIn,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        false
                    ]
                ]
            ]
            let calcAmount = await router.getAmountsOut(...args)
            console.log("volatile calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
            // stable
            let argsStable = [
                amountIn,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        true
                    ]
                ]
            ]
            calcAmount = await router.getAmountsOut(...argsStable)
            console.log("stable calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
        });

        it("getAmountIn", async function () {
            const ans = await loadFixture(deployContracts);

            let router = ans.router

            let reserveIn = expandTo18Decimals("100"), reserveOut = expandTo18Decimals("100"),
                amountOut = expandTo18Decimals("10")
            // let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            // console.log("volatile desireAmountOut without fee:", desireAmountOut)

            // volatile
            let calcAmount = await router.getAmountIn(amountOut, reserveIn, reserveOut, false, decimals18, decimals18)
            console.log("volatile calcAmount:", ethers.utils.formatEther(calcAmount))
            // // stable
            calcAmount = await router.getAmountIn(amountOut, reserveIn, reserveOut, true, decimals18, decimals18)
            console.log("stable calcAmount:", ethers.utils.formatEther(calcAmount))
        });
        //
        it("getAmountsIn", async function () {
            const ans = await loadFixture(deployContracts);

            const weth = ans.weth
            const tt = ans.tt
            const router = ans.router
            const pair = ans.pair
            let token0 = await pair.token0()
            let [reserve0, reserve1] = await pair.getReserves()
            let reserveIn, reserveOut
            if (token0 === weth.address) {
                [reserveIn, reserveOut] = [reserve0, reserve1]
            } else {
                [reserveIn, reserveOut] = [reserve1, reserve0]
            }
            let amountOut = expandTo18Decimals("1")
            // volatile
            let args = [
                amountOut,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        false
                    ]
                ]
            ]
            let calcAmount = await router.getAmountsIn(...args)
            console.log("volatile calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
            // stable
            let argsStable = [
                amountOut,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        true
                    ]
                ]
            ]
            calcAmount = await router.getAmountsIn(...argsStable)
            console.log("stable calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
        });

        it("getPair", async function () {
            let ans = await loadFixture(deployContracts)
            let {address0, address1} = ans.weth.address < ans.tt.address ? {
                address0: ans.weth.address,
                address1: ans.tt.address
            } : {address0: ans.tt.address, address1: ans.weth.address}
            let initCodeHash = ethers.utils.keccak256((await ethers.getContractFactory("TeleswapV2Pair")).bytecode)
            let salt = await ethers.utils.solidityKeccak256(['address', 'address', 'bool'], [address0, address1, false])
            let calcedAddress = await ethers.utils.getCreate2Address(ans.factory.address, salt, initCodeHash)
            console.log("calced address", calcedAddress)
            console.log("volatile pair addr", ans.pair.address)
        })

    })

    describe('core func', function () {

        it("addLiquidity", async function () {
            let ans = await loadFixture(deployContracts)
            let args = [
                [ans.weth.address, ans.tt.address],
                expandTo18Decimals(1),
                expandTo18Decimals(1),
                1,
                1,
                ans.signer.address,
                (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            ]
            console.log("reserve before", await ans.pair.getReserves())
            await ans.router.addLiquidity(...args)
            // check liquidity
            console.log("reserve after", await ans.pair.getReserves())

            let stableArgs = [
                getRoute(ans, true),
                expandTo18Decimals(1),
                expandTo18Decimals(1),
                1,
                1,
                ans.signer.address,
                (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            ]
            console.log("reserve before", await ans.pairStable.getReserves())
            await ans.router.addLiquidity(...stableArgs)
            console.log("reserve after", await ans.pairStable.getReserves())


        })
        it("addLiquidityETH", async function () {
            let ans = await loadFixture(deployContracts)
            let params = [
                getRoute(ans, false),
                expandTo18Decimals(1),
                0, 0,
                ans.signer.address,
                getDeadline()
            ]
            let overrides = {
                value: expandTo18Decimals(1)
            }
            await ans.router.addLiquidityETH(
                ...params,
                overrides
            )

            let paramsStable = [
                getRoute(ans, true),
                expandTo18Decimals(1),
                0, 0,
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.addLiquidityETH(
                ...paramsStable,
                overrides
            )


        })
        it("removeLiquidity", async function () {
            let ans = await loadFixture(deployContracts)
            let liquidity = (await ans.pair.balanceOf(ans.signer.address))
            await ans.pair.approve(ans.router.address, liquidity)

            await ans.router.removeLiquidity(
                ...[
                    [ans.tt.address, ans.weth.address, false],
                    liquidity.div(2),
                    0,
                    0,
                    ans.signer.address,
                    getDeadline()
                ]
            )


            // stable
            liquidity = (await ans.pairStable.balanceOf(ans.signer.address))
            await ans.pairStable.approve(ans.router.address, liquidity)
            await ans.router.removeLiquidity(
                ...[
                    [ans.tt.address, ans.weth.address, true],
                    liquidity,
                    0,
                    0,
                    ans.signer.address,
                    getDeadline()
                ]
            )

        })

        it("removeLiquidityETH", async function () {
            let ans = await loadFixture(deployContracts)
            let liquidity = await ans.pair.balanceOf(ans.signer.address)
            await ans.pair.approve(ans.router.address, liquidity)
            await ans.router.removeLiquidityETH(
                ...[
                    [ans.tt.address, ans.weth.address, false],
                    liquidity,
                    0,
                    0,
                    ans.signer.address,
                    getDeadline()
                ]
            )

            // stable
            let liquidityStable = await ans.pairStable.balanceOf(ans.signer.address)
            await ans.pairStable.approve(ans.router.address, liquidityStable)
            await ans.router.removeLiquidityETH(
                ...[
                    getRoute(ans, true),
                    liquidity,
                    0,
                    0,
                    ans.signer.address,
                    getDeadline()
                ]
            )
        })

        it("removeLiquidityWithPermit", async function () {
            let ans = await loadFixture(deployContracts)
            // cancle approve
            await ans.pair.approve(ans.router.address, 0)
            console.log("approve 0 to router", await ans.pair.allowance(ans.signer.address, ans.router.address))

            //Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)

            // The data to sign
            let dl = getDeadline()
            let burnAmt = (await ans.pair.balanceOf(ans.signer.address))




            let args = [
                getRoute(ans, false),
                burnAmt,
                0, 0,
                ans.signer.address,
                dl,
                false,
                await getSig(ans,false,dl)
            ]
            console.log("before remove", await ans.pair.balanceOf(ans.signer.address))
            await ans.router.removeLiquidityWithPermit(...args)



            // stable
            console.log("stable")
            let sig = await getSig(ans, true, dl)
            let stableArgs = [
                getRoute(ans, true),
                await ans.pairStable.balanceOf(ans.signer.address),
                0, 0,
                ans.signer.address,
                dl,
                false,
                sig
            ]
            await ans.router.removeLiquidityWithPermit(...stableArgs)


        })

        it("removeLiquidityETHSupportingFeeOnTransferTokens", async () => {

            let ans = await loadFixture(deployContracts)
            let liquidity = await ans.pair.balanceOf(ans.signer.address)
            await ans.pair.approve(ans.router.address, liquidity)
            let params = [
                getRoute(ans, false),
                liquidity,
                0, 0,
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.removeLiquidityETHSupportingFeeOnTransferTokens(...params)

            //stable
            console.log("stable")
            let liquidityStable = await ans.pairStable.balanceOf(ans.signer.address)
            await ans.pairStable.approve(ans.router.address, liquidityStable)
            let stableParams = [
                getRoute(ans, true),
                liquidityStable,
                0, 0,
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.removeLiquidityETHSupportingFeeOnTransferTokens(...stableParams)

        })
        it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () => {

            let ans = await loadFixture(deployContracts)
            let liquidity = ans.pair.balanceOf(ans.signer.address)
            let dl = getDeadline()
            await ans.pair.approve(ans.router.address, liquidity)
            let args = [
                getRoute(ans, false),
                liquidity,
                0, 0,
                ans.signer.address,
                dl,
                false,
                await getSig(ans,false,dl)
            ]
            await ans.router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(...args)


            // stable
            console.log("stable")
            let liquidityStable = ans.pairStable.balanceOf(ans.signer.address)
            await ans.pairStable.approve(ans.router.address, liquidityStable)
            let stableArgs = [
                getRoute(ans, true),
                liquidityStable,
                0, 0,
                ans.signer.address,
                dl,
                false,
                await getSig(ans,true,dl)
            ]
            await ans.router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(...stableArgs)
        })
        it("swapExactTokensForTokens", async function () {
            const ans = await loadFixture(deployContracts);
            const signer = (await ethers.getSigners())[0]
            // tt query
            let ttBalanceBefore = await ans.tt.balanceOf(signer.address)
            let wetBalanceBefore = await ans.weth.balanceOf(signer.address)


            // swapExactTokensForTokens
            let amountIn = expandTo18Decimals(1), amountOutMin = 1, to = signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.weth.address,
                ans.tt.address,
                false
            ]
            let args = [
                amountIn,
                amountOutMin,
                [route],
                to,
                deadline * 2
            ]
            await ans.router.swapExactTokensForTokens(...args)

            // volatile swap
            let ttBalanceAfter = await ans.tt.balanceOf(signer.address)
            let wethBalanceAfter = await ans.weth.balanceOf(signer.address)
            console.log('weth balance before', wetBalanceBefore)
            console.log('weth balance after', wethBalanceAfter)
            console.log('weth dBalance:', wetBalanceBefore.sub(wethBalanceAfter))
            console.log('tt balance before', ttBalanceBefore)
            console.log('tt balance after', ttBalanceAfter)
            console.log('tt dBalance:', ttBalanceAfter.sub(ttBalanceBefore))


            // stable swap
            console.log("stable swap")
            // tt query
            let ttbefore = await ans.tt.balanceOf(signer.address)
            let wetbefore = await ans.weth.balanceOf(signer.address)
            let stableArgs =
                [
                    amountIn,
                    amountOutMin,
                    [
                        [
                            ans.weth.address,
                            ans.tt.address,
                            true
                        ]
                    ],
                    to,
                    deadline * 2
                ]

            await ans.router.swapExactTokensForTokens(...stableArgs)
            let ttAfter = await ans.tt.balanceOf(signer.address)
            let wethAfter = await ans.weth.balanceOf(signer.address)
            console.log('eth balance before', wetbefore)
            console.log('eth balance after', wethAfter)
            console.log('eth dBalance:', wetbefore.sub(wethAfter))
            console.log('tt balance before', ttbefore)
            console.log('tt balance after', ttAfter)
            console.log('tt dBalance:', ttAfter.sub(ttbefore))

        })

        it("swapTokensForExactTokens", async function () {
            const ans = await loadFixture(deployContracts);
            const signer = (await ethers.getSigners())[0]
            // tt query
            let ttBalanceBefore = await ans.tt.balanceOf(signer.address)
            let wetBalanceBefore = await ethers.provider.getBalance(signer.address)


            let amountOut = expandTo18Decimals(1), amountInMax = amountOut.mul(BigNumber.from(2)), to = signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.weth.address,
                ans.tt.address,
                false
            ]
            let args = [
                amountOut,
                amountInMax,
                [route],
                to,
                deadline * 2
            ]
            await ans.router.swapTokensForExactTokens(...args)

            // volatile swap
            let ttBalanceAfter = await ans.tt.balanceOf(signer.address)
            let wethBalanceAfter = await ans.weth.balanceOf(signer.address)
            console.log('weth balance before', wetBalanceBefore)
            console.log('weth balance after', wethBalanceAfter)
            console.log('weth dBalance:', wetBalanceBefore.sub(wethBalanceAfter))
            console.log('tt balance before', ttBalanceBefore)
            console.log('tt balance after', ttBalanceAfter)
            console.log('tt dBalance:', ttBalanceAfter.sub(ttBalanceBefore))


            // stable swap
            console.log("stable swap")
            // tt query
            let ttbefore = await ans.tt.balanceOf(signer.address)
            let wetbefore = await ans.weth.balanceOf(signer.address)
            route
            let stableArgs =
                [
                    amountOut,
                    amountInMax,
                    [
                        [
                            ans.weth.address,
                            ans.tt.address,
                            true
                        ]
                    ],
                    to,
                    deadline * 2
                ]

            await ans.router.swapTokensForExactTokens(...stableArgs)
            let ttAfter = await ans.tt.balanceOf(signer.address)
            let wethAfter = await ans.weth.balanceOf(signer.address)
            console.log('weth balance before', wetbefore)
            console.log('weth balance after', wethAfter)
            console.log('weth dBalance:', wetbefore.sub(wethAfter))
            console.log('tt balance before', ttbefore)
            console.log('tt balance after', ttAfter)
            console.log('tt dBalance:', ttAfter.sub(ttbefore))

        })

        it("swapExactETHForTokens", async function () {
            const ans = await loadFixture(deployContracts);
            const signer = (await ethers.getSigners())[0]
            // tt query
            let ttBalanceBefore = await ans.tt.balanceOf(signer.address)
            let wetBalanceBefore = await ethers.provider.getBalance(signer.address)


            // swapExactTokensForTokens
            let amountIn = BigNumber.from(10).pow(16), amountOutMin = 1, to = signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.weth.address,
                ans.tt.address,
                false
            ]
            let args = [
                amountOutMin,
                [route],
                to,
                deadline * 2
            ]
            console.log()
            await ans.router.swapExactETHForTokens(...args, {value: amountIn})

            // volatile swap
            let ttBalanceAfter = await ans.tt.balanceOf(signer.address)
            let wethBalanceAfter = await ans.weth.balanceOf(signer.address)
            console.log('eth balance before', wetBalanceBefore)
            console.log('eth balance after', wethBalanceAfter)
            console.log('eth dBalance:', wetBalanceBefore.sub(wethBalanceAfter))
            console.log('tt balance before', ttBalanceBefore)
            console.log('tt balance after', ttBalanceAfter)
            console.log('tt dBalance:', ttBalanceAfter.sub(ttBalanceBefore))

            // stable swap
            console.log("stable swap")
            // tt query
            let ttbefore = await ans.tt.balanceOf(signer.address)
            let wetbefore = await ethers.provider.getBalance(signer.address)
            let stableArgs =
                [
                    amountOutMin,
                    [
                        [
                            ans.weth.address,
                            ans.tt.address,
                            true
                        ]
                    ],
                    to,
                    deadline * 2
                ]

            await ans.router.swapExactETHForTokens(...stableArgs, {value: amountIn})
            let ttAfter = await ans.tt.balanceOf(signer.address)
            let wethAfter = await ethers.provider.getBalance(signer.address)
            console.log('eth balance before', wetbefore)
            console.log('eth balance after', wethAfter)
            console.log('eth dBalance:', wetbefore.sub(wethAfter))
            console.log('tt balance before', ttbefore)
            console.log('tt balance after', ttAfter)
            console.log('tt dBalance:', ttAfter.sub(ttbefore))

        })

        it("swapTokensForExactETH", async function () {

            const ans = await loadFixture(deployContracts);


            const signer = (await ethers.getSigners())[0]

            // tt query
            let ttBalanceBefore = await ans.tt.balanceOf(signer.address)
            let ethBalanceBefore = await ethers.provider.getBalance(signer.address)


            let amountOut = expandTo18Decimals(1), amountInMax = amountOut.mul(BigNumber.from(2)), to = signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.tt.address,
                ans.weth.address,
                false
            ]
            let args = [
                amountOut,
                amountInMax,
                [route],
                to,
                deadline * 2
            ]
            await ans.router.swapTokensForExactETH(...args)

            // volatile swap
            let ttBalanceAfter = await ans.tt.balanceOf(signer.address)
            let ethBalanceAfter = await ethers.provider.getBalance(signer.address)
            console.log('eth balance before', ethBalanceBefore)
            console.log('eth balance after', ethBalanceAfter)
            console.log('eth dBalance:', ethBalanceAfter.sub(ethBalanceBefore))
            console.log('tt balance before', ttBalanceBefore)
            console.log('tt balance after', ttBalanceAfter)
            console.log('tt dBalance:', ttBalanceBefore.sub(ttBalanceAfter))


            // stable swap
            console.log("stable swap")
            // tt query
            let ttbefore = await ans.tt.balanceOf(signer.address)
            let ethbefore = await ethers.provider.getBalance(signer.address)
            route
            let stableArgs =
                [
                    amountOut,
                    amountInMax,
                    [
                        [
                            ans.tt.address,
                            ans.weth.address,
                            true
                        ]
                    ],
                    to,
                    deadline * 2
                ]

            await ans.router.swapTokensForExactETH(...stableArgs)
            let ttAfter = await ans.tt.balanceOf(signer.address)
            let ethAfter = await ethers.provider.getBalance(signer.address)
            console.log('eth balance before', ethbefore)
            console.log('eth balance after', ethAfter)
            console.log('eth dBalance:', ethAfter.sub(ethbefore))
            console.log('tt balance before', ttbefore)
            console.log('tt balance after', ttAfter)
            console.log('tt dBalance:', ttbefore.sub(ttAfter))

        })
        it("swapExactTokensForETH", async () => {
            // function swapExactTokensForETH(uint amountIn, uint amountOutMin, route[] calldata routes, address to, uint deadline)
            let ans = await loadFixture(deployContracts)
            let params = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, false),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForETH(...params)

            // stable
            let paramsStable = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, true),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForETH(...paramsStable)

        })
        it("swapETHForExactTokens", async () => {
            // function swapETHForExactTokens(uint amountOut, route[] calldata routes, address to, uint deadline)
            let ans = await loadFixture(deployContracts)
            let args = [
                expandTo18Decimals(1),
                [[ans.weth.address,ans.tt.address,false]],
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapETHForExactTokens(...args,{value:expandTo18Decimals(2)})


            // stable
            console.log("stable")
            let stableArgs = [
                expandTo18Decimals(1),
                [[ans.weth.address,ans.tt.address,true]],
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapETHForExactTokens(...stableArgs,{value:expandTo18Decimals(2)})

        })
        it("swapExactTokensForTokensSupportingFeeOnTransferTokens", async () => {

            let ans = await loadFixture(deployContracts)
            let args = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, false),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForTokensSupportingFeeOnTransferTokens(...args)

            // stable
            console.log("stable")
            let stableArgs = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, true),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForTokensSupportingFeeOnTransferTokens(...stableArgs)

        })
        it("swapExactETHForTokensSupportingFeeOnTransferTokens", async () => {
            let ans = await loadFixture(deployContracts)
            let args = [
                0,
                [[ans.weth.address, ans.tt.address, false]],
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactETHForTokensSupportingFeeOnTransferTokens(...args, {value: expandTo18Decimals(1)})

            // stable
            console.log("stable")
            let stableArgs = [
                0,
                [[ans.weth.address, ans.tt.address, true]],
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactETHForTokensSupportingFeeOnTransferTokens(...stableArgs, {value: expandTo18Decimals(1)})



        })
        it("swapExactTokensForETHSupportingFeeOnTransferTokens", async () => {
            let ans = await loadFixture(deployContracts)
            let args = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, false),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForETHSupportingFeeOnTransferTokens(...args)

        //    stable
            let stableArgs = [
                expandTo18Decimals(1),
                0,
                getRoutes(ans, true),
                ans.signer.address,
                getDeadline()
            ]
            await ans.router.swapExactTokensForETHSupportingFeeOnTransferTokens(...stableArgs)


        })


        it("2addLiquidity", async function () {
            let ans = await loadFixture(deployContracts)
            let args = [
                [ans.weth.address, ans.tt.address],
                expandTo18Decimals(1),
                expandTo18Decimals(1),
                1,
                1,
                ans.signer.address,
                (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            ]
            console.log("reserve before", await ans.pair.getReserves())
            await ans.router.addLiquidity(...args)
            // check liquidity
            console.log("reserve after", await ans.pair.getReserves())

            // swap
            let amountIn = expandTo18Decimals(1), amountOutMin = 1, to = ans.signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.weth.address,
                ans.tt.address,
                false
            ]
            let swapargs = [
                amountIn,
                amountOutMin,
                [route],
                to,
                deadline * 2
            ]
            await ans.router.swapExactTokensForTokens(...swapargs)
            await ans.router.swapExactTokensForTokens(...swapargs)
            await ans.router.swapExactTokensForTokens(...swapargs)
            await ans.router.swapExactTokensForTokens(...swapargs)

            // twice add
            await ans.router.addLiquidity(...args)
            console.log("reserve after", await ans.pair.getReserves())
        })


    })


});


function expandTo18Decimals(n) {
    return BigNumber.from(n).mul(BigNumber.from("10").pow(18))
}

function getDeadline() {
    return (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000) * 2
}

async function getApprovalDigest(
    token,
    approve,
    nonce,
    deadline
) {
    const name = await token.name()
    const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address)
    return keccak256(
        solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                keccak256(
                    defaultAbiCoder.encode(
                        ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                        [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
                    )
                )
            ]
        )
    )
}


function getRoute(ans, stable) {
    return [ans.tt.address, ans.weth.address, stable]
}

function getRoutes(ans, stable) {
    return [getRoute(ans, stable)]
}

async function getSig(ans, stable, dl) {
    const {chainId} = await ethers.provider.getNetwork();
    let pair = stable ? ans.pairStable : ans.pair
    const domain = {
        name: 'Teleswap V2',
        version: '1',
        chainId: chainId,
        verifyingContract: pair.address,
    };
    //Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
    const types = {
        Permit: [
            {name: 'owner', type: 'address'},
            {name: 'spender', type: 'address'},
            {name: 'value', type: 'uint256'},
            {name: 'nonce', type: 'uint256'},
            {name: 'deadline', type: 'uint256'},
        ]
    };
    // The data to sign

    const value = {
        owner: ans.signer.address,
        spender: ans.router.address,
        value: await pair.balanceOf(ans.signer.address),
        nonce: await pair.nonces(ans.signer.address),
        deadline: dl,
    };
    let signature = await ans.signer._signTypedData(domain, types, value);
    let {v, r, s} = await ethers.utils.splitSignature(signature)
    return [v, r, s]
}