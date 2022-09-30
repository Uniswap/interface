const {expect} = require("chai");
const hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {sign} = require("ethereumjs-util/dist/secp256k1v3-adapter");

const ethers = hre.ethers
const BigNumber = ethers.BigNumber
describe('Router02', function () {
    const decimals18 = 18

    async function deployContracts() {
        const [signer] = await ethers.getSigners()
        let ans = await hre.run("deploy")
        ans.signer = signer
        return ans
    }

    describe('calc logic', function () {
        it("getAmountOut", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts);

                let router = ans.router
                let amountIn = ethers.utils.parseUnits("1", 18)
                let reserveIn = ethers.utils.parseUnits("10", 18)
                let reserveOut = ethers.utils.parseUnits("10", 18)
                let args = [
                    amountIn,
                    reserveIn,
                    reserveOut,
                    stable,
                    decimals18, decimals18
                ]
                // getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, bool stable, uint decimalIn, uint decimalOut)
                let amountOut = await router.getAmountOut(...args)
                console.log(
                    ` 
                 if stable: ${stable}
                 reserveIn is ${reserveIn}
                 reserveOut is ${reserveOut}
                 amountIn is ${amountIn} 
                 amountOut is ${amountOut}
                 `
                )

            }

        });

        it("getAmountsOut", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);


                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                await addLiquidity(ans, ans.weth, ans.usdt, ethAmt, tokenAmt, stable, ethAmt)

                // amount
                // uint amountIn, route[] memory _routes)
                let amountIn = ethers.utils.parseUnits("18", 18)
                let outs = await ans.router.getAmountsOut(amountIn, [[ans.usdt.address, ans.weth.address, stable]])
                console.log(
                    `
                        if stable: ${stable}
                        Amounts: ${outs}   
                    `
                )
            }

        });

        it("getAmountIn", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts)
                let router = ans.router

                let reserveIn = expandTo18Decimals("100"), reserveOut = expandTo18Decimals("100"),
                    amountOut = expandTo18Decimals("10")

                let amountIn = await router.getAmountIn(amountOut, reserveIn, reserveOut, stable, decimals18, decimals18)
                console.log(
                    ` 
                 if stable: ${stable}
                 reserveIn is ${reserveIn}
                 reserveOut is ${reserveOut}
                 amountIn is ${amountIn} 
                 amountOut is ${amountOut}
                 `
                )

            }
        });
        //
        it("getAmountsIn", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);

                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [ans.usdt.address, ans.weth.address, stable]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)


                // amount
                // uint amountIn, route[] memory _routes)
                let amountOut = ethers.utils.parseUnits("1", 15)
                let outs = await ans.router.getAmountsIn(amountOut, [route])
                console.log(
                    `
                        if stable: ${stable}
                        Amounts: ${outs}   
                    `
                )
            }

        });

        it("getPair", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts)

                // create pair
                // function createPair(address tokenA, address tokenB, bool stable) override external returns (address pair) {


                // calc local
                let calcedAddress, address0, address1

                {
                    [address0, address1] = ans.weth.address < ans.tt.address ?
                        [ans.weth.address, ans.tt.address]
                        : [ans.tt.address, ans.weth.address]
                    let initCodeHash = ethers.utils.keccak256((await ethers.getContractFactory("TeleswapV2Pair")).bytecode)
                    let salt = await ethers.utils.solidityKeccak256(['address', 'address', 'bool'], [address0, address1, stable])
                    calcedAddress = await ethers.utils.getCreate2Address(ans.factory.address, salt, initCodeHash)
                }

                // emit PairCreated(token0, token1, stable, pair, allPairs.length);
                await expect(ans.factory.createPair(ans.tt.address, ans.weth.address, stable))
                    .to
                    .emit(ans.factory, 'PairCreated')
                    .withArgs(
                        address0,
                        address1,
                        stable,
                        calcedAddress,
                        1
                    );
            }
        })

    })

    describe('core func', function () {

        it("addLiquidity", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts)
                //ans, tokenA, tokenB, aAmount, bAmount, stable, value
                let aAmount = ethers.utils.parseUnits("1", 16)
                let bAmount = ethers.utils.parseUnits("18", 18)

                await addLiquidity(
                    ans,
                    ans.weth,
                    ans.tt,
                    aAmount,
                    bAmount,
                    stable,
                    0
                );

            }


        })
        it("addLiquidityETH", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)

                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)
            }


        })
        it("removeLiquidity", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)

                // add liquidity
                let aAmount = ethers.utils.parseUnits("1", 16)
                let bAmount = ethers.utils.parseUnits("18", 18)
                await addLiquidity(
                    ans,
                    ans.weth,
                    ans.tt,
                    aAmount,
                    bAmount,
                    stable,
                    0
                );
                // get pair
                let pair = await ethers.getContractAt("TeleswapV2Pair", await ans.factory.getPair(ans.weth.address, ans.tt.address, stable))
                let liquidity = (await pair.balanceOf(ans.signer.address))
                await pair.approve(ans.router.address, liquidity)

                await ans.router.removeLiquidity(
                    ...[
                        [ans.tt.address, ans.weth.address, stable],
                        liquidity.div(2),
                        0,
                        0,
                        ans.signer.address,
                        getDeadline()
                    ]
                )
            }

        })

        it("removeLiquidityETH", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)

                // add liquidity
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                let tokena = ans.usdt, tokenb = ans.weth
                //usdt-weth  addliquidityETH
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)
                // getPair
                let pair = await getPair(tokena.address, tokenb.address, ans.factory.address, stable)

                let liquidity = await pair.balanceOf(ans.signer.address)
                await pair.approve(ans.router.address, liquidity)
                await ans.router.removeLiquidityETH(
                    ...[
                        [ans.usdt.address, ans.weth.address, stable],
                        liquidity,
                        0,
                        0,
                        ans.signer.address,
                        getDeadline()
                    ]
                )

            }
        })

        it("removeLiquidityWithPermit", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                await addLiquidity(ans, ans.weth, ans.tt, ethers.utils.parseUnits("1", 16), ethers.utils.parseUnits("18", 18), stable, 0);
                let route = [ans.weth.address, ans.tt.address, stable]
                let pair = await getPair(ans.weth.address, ans.tt.address, ans.factory.address, stable)

                //Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)

                // The data to sign
                let dl = getDeadline()
                let burnAmt = (await pair.balanceOf(ans.signer.address))


                let args = [
                    route,
                    burnAmt,
                    0, 0,
                    ans.signer.address,
                    dl,
                    false,
                    await getSig(pair, ans.signer.address, ans.router.address, false, dl, burnAmt)
                ]
                console.log("before remove", await pair.balanceOf(ans.signer.address))
                await ans.router.removeLiquidityWithPermit(...args)


            }


        })

        it("removeLiquidityETHSupportingFeeOnTransferTokens", async () => {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                // usdt-dai add liquitiy
                await addLiquidity(ans, ans.usdt, ans.weth, expandTo18Decimals(10), expandTo18Decimals(1), stable, expandTo18Decimals(1))
                let pair = await getPair(ans.usdt.address, ans.weth.address, ans.factory.address, stable)
                let liquidity = await pair.balanceOf(ans.signer.address)

                await pair.approve(ans.router.address, liquidity)
                let params = [
                    [ans.usdt.address, ans.weth.address, stable],
                    liquidity,
                    0, 0,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.removeLiquidityETHSupportingFeeOnTransferTokens(...params)

            }

        })
        it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () => {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                await addLiquidity(ans, ans.usdt, ans.weth, expandTo18Decimals(10), expandTo18Decimals(1), stable, expandTo18Decimals(1))
                let pair = await getPair(ans.usdt.address, ans.weth.address, ans.factory.address, stable)
                let liquidity = await pair.balanceOf(ans.signer.address)
                let dl = getDeadline()
                await pair.approve(ans.router.address, liquidity)
                let route = [ans.usdt.address, ans.weth.address, stable]
                let args = [
                    route,
                    liquidity,
                    0, 0,
                    ans.signer.address,
                    dl,
                    false,
                    await getSig(pair, ans.signer.address, ans.router.address, stable, dl, liquidity)
                ]
                await ans.router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(...args)
            }
        })
        it("swapExactTokensForTokens", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);
                const signer = (await ethers.getSigners())[0]

                // add liquidity
                await addLiquidity(ans, ans.tt, ans.weth, expandTo18Decimals(1), expandTo18Decimals(18), stable, 0)
                let route = [ans.tt.address,ans.weth.address,  stable]

                let amountIn = expandTo18Decimals(1)
                //approve
                await ans.tt.approve(ans.router.address, amountIn)

                let args = [
                    amountIn,
                    0,
                    [route],
                    ans.signer.address,
                    getDeadline()
                ]

                await ans.router.swapExactTokensForTokens(...args)
            }

        })

        it("swapTokensForExactTokens", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);

                // add liquidity
                await addLiquidity(ans, ans.tt, ans.weth, expandTo18Decimals(1), expandTo18Decimals(18), stable, 0)
                let route = [ans.tt.address,ans.weth.address,  stable]


                let amountOut = ethers.utils.parseUnits("1","ether"), amountInMax = amountOut.mul(BigNumber.from(2))
                // approve
                await ans.tt.approve(ans.router.address, amountInMax)



                let args = [
                    amountOut,
                    amountInMax,
                    [route],
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapTokensForExactTokens(...args)
            }

        })

        it("swapExactETHForTokens", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);



                // swapExactTokensForTokens
                let amountIn = BigNumber.from(10).pow(16), amountOutMin = 1
                let route = [
                    ans.weth.address,
                    ans.tt.address,
                    stable
                ]
                // add liquidity
                await addLiquidity(ans, ans.weth, ans.tt, expandTo18Decimals(1), expandTo18Decimals(18), stable, 0)

                let args = [
                    amountOutMin,
                    [route],
                    ans.signer.address,
                    getDeadline()
                ]
                console.log()
                await ans.router.swapExactETHForTokens(...args, {value: amountIn})

            }

        })

        it("swapTokensForExactETH", async function () {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                const ans = await loadFixture(deployContracts);

                //add liquidity
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.usdt.address, ans.weth.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)

                await ans.usdt.approve(ans.router.address, tokenAmt)


                let amountOut = ethers.utils.parseUnits("1",15), amountInMax = tokenAmt

                let args = [
                    amountOut,
                    amountInMax,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapTokensForExactETH(...args)


            }
        })
        it("swapExactTokensForETH1", async () => {
            // function swapExactTokensForETH(uint amountIn, uint amountOutMin, route[] calldata routes, address to, uint deadline)
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.usdt.address, ans.weth.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)

                await ans.usdt.approve(ans.router.address, tokenAmt)

                let params = [
                    tokenAmt,
                    0,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapExactTokensForETH(...params)

            }

        })
        it("swapETHForExactTokens", async () => {
            // function swapETHForExactTokens(uint amountOut, route[] calldata routes, address to, uint deadline)
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.weth.address, ans.usdt.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)

                await ans.usdt.approve(ans.router.address, tokenAmt)
                let args = [
                    ethAmt,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapETHForExactTokens(...args, {value: ethAmt})
            }

        })
        it("swapExactTokensForTokensSupportingFeeOnTransferTokens", async () => {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                // add liquidity
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.usdt.address, ans.weth.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)
                // approve router
                await ans.usdt.approve(ans.router.address, tokenAmt)
                let args = [
                    tokenAmt,
                    0,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapExactTokensForTokensSupportingFeeOnTransferTokens(...args)

            }

        })
        it("swapExactETHForTokensSupportingFeeOnTransferTokens", async () => {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)
                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.weth.address, ans.usdt.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, ethAmt)
                //approve
                await ans.usdt.approve(ans.router.address, tokenAmt)

                let args = [
                    0,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapExactETHForTokensSupportingFeeOnTransferTokens(...args, {value: ethAmt})
            }
        })
        it("swapExactTokensForETHSupportingFeeOnTransferTokens", async () => {
            for (let i = 0; i < 2; i++) {
                let stable = i === 0
                let ans = await loadFixture(deployContracts)

                let ethAmt = ethers.utils.parseUnits("1", 16)
                let tokenAmt = ethers.utils.parseUnits("18", 18)
                //usdt-weth  addliquidityETH
                let route = [[ans.usdt.address, ans.weth.address, stable]]
                await addLiquidity(ans, ans.usdt, ans.weth, tokenAmt, ethAmt, stable, 0)


                let pair = await getPair(ans.usdt.address, ans.weth.address, ans.factory.address, stable)
                // approve
                await ans.usdt.approve(ans.router.address, tokenAmt)
                let args = [
                    tokenAmt,
                    0,
                    route,
                    ans.signer.address,
                    getDeadline()
                ]
                await ans.router.swapExactTokensForETHSupportingFeeOnTransferTokens(...args)

            }

        })


    })

    describe("Chores", function () {

        it("keyCaseSensetive", async function () {
            let ans = await loadFixture(deployContracts)
            let aAmount = ethers.utils.parseUnits("1", 16)
            let bAmount = ethers.utils.parseUnits("18", 18)

            await addLiquidity(ans, ans.weth, ans.usdt, aAmount, bAmount, false, 0)
            console.log("pair is ", await ans.factory.getPair(ans.weth.address, ans.usdt.address, false))
            console.log("lowcase", await ans.factory.getPair(ans.weth.address.toLowerCase(), ans.usdt.address.toLowerCase(), false))
            console.log(`address is ${ans.weth.address} ,lowercase is ${ans.weth.address.toLowerCase()}`)

        })
    })


});


async function calcPair(tokena, tokenb, factory, stable) {
    let calcedAddress, address0, address1

    [address0, address1] = tokena < tokenb ?
        [tokena, tokenb]
        : [tokenb, tokena]
    let initCodeHash = ethers.utils.keccak256((await ethers.getContractFactory("TeleswapV2Pair")).bytecode)
    let salt = await ethers.utils.solidityKeccak256(['address', 'address', 'bool'], [address0, address1, stable])
    return await ethers.utils.getCreate2Address(factory, salt, initCodeHash)
}

async function getPair(tokena, tokenb, factory, stable) {
    return await ethers.getContractAt("TeleswapV2Pair", await calcPair(tokena, tokenb, factory, stable))
}

async function addLiquidity(ans, tokenA, tokenB, aAmount, bAmount, stable, value) {

    // get Token
    if (tokenA.address === ans.weth.address) {
        // deposit
        if (value === 0) await tokenA.deposit({value: aAmount})
        await tokenB.mint()
    } else if (tokenB.address === ans.weth.address) {
        if (value === 0) await tokenB.deposit({value: bAmount})
        await tokenA.mint()
    } else {
        await tokenA.mint()
        await tokenB.mint()
    }


    let route = [tokenA.address, tokenB.address, stable]
    if (tokenA.address === ans.weth.address) {
        route = [tokenB.address, tokenA.address, stable]
    }
    tokenA.approve(ans.router.address, aAmount)
    tokenB.approve(ans.router.address, bAmount)
    //     function addLiquidity(
    //         route calldata _route,
    //         uint amountADesired,
    //         uint amountBDesired,
    //         uint amountAMin,
    //         uint amountBMin,
    //         address to,
    //         uint deadline
    // )
    let [amount0, amount1] = tokenA.address === route[0] ? [aAmount, bAmount] : [bAmount, aAmount]
    let args = [
        route,
        amount0, amount1,
        0, 0,
        ans.signer.address,
        getDeadline()
    ]

    if (value === 0) {
        await ans.router.addLiquidity(...args)
    } else {
        let args = [
            route,
            amount0,
            0, 0,
            ans.signer.address,
            getDeadline()
        ]
        await ans.router.addLiquidityETH(...args, {value: value})
    }


}


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


async function getSig(pair, signer, router, stable, dl, approveVal) {
    const {chainId} = await ethers.provider.getNetwork();
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
        owner: signer,
        spender: router,
        value: approveVal,
        nonce: await pair.nonces(signer),
        deadline: dl,
    };
    let signert = await ethers.getSigner(signer)
    let signature = await signert._signTypedData(domain, types, value);
    let {v, r, s} = await ethers.utils.splitSignature(signature)
    return [v, r, s]
}