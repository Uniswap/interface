// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";

/**
 * SeedLiquidity — seed a small TEST/WETH v2 pool so the HookSwap smart-order-router
 * has a real pool with reserves to quote. Deploys a tiny test ERC-20, wraps some
 * native into WETH, and adds liquidity via the deployed v2 Router02.
 *
 * Sepolia (canonical stack) example:
 *   forge script contracts/seed/SeedLiquidity.s.sol:SeedLiquidity \
 *     --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
 *     --private-key $DEPLOYER_PRIVATE_KEY --broadcast \
 *     --sig "run(address,address,uint256,uint256)" \
 *     0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3 \  # v2 Router02 (Sepolia canonical)
 *     0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 \  # WETH (Sepolia)
 *     50000000000000000 \                            # 0.05 WETH into the pool
 *     1000000000000000000000                         # 1,000 TEST into the pool
 *
 * For a HookSwap chain, pass that chain's v2Router02 + wrapped-native from
 * contracts/deployments/<chain>.json. Only the pool needs seeding; the router +
 * factory already exist.
 *
 * After it runs it logs the TEST token address + pair — quote TEST->WETH (or WETH->TEST)
 * through the adapter to verify routing.
 */
interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

interface IV2Router02 {
    function factory() external view returns (address);
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

interface IV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

/** Minimal fixed-supply ERC-20 for seeding a test pool. */
contract SeedTestToken {
    string public name = "HookSwap Test";
    string public symbol = "HKT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(uint256 supply, address to) {
        totalSupply = supply;
        balanceOf[to] = supply;
        emit Transfer(address(0), to, supply);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        require(a >= amount, "allowance");
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract SeedLiquidity is Script {
    function run(address router, address weth, uint256 wethAmount, uint256 testAmount) external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address me = vm.addr(pk);

        vm.startBroadcast(pk);

        // 1. Deploy the test token (full supply to us; we add `testAmount` to the pool).
        SeedTestToken token = new SeedTestToken(testAmount * 2, me);

        // 2. Wrap native -> WETH for the WETH side of the pool.
        IWETH(weth).deposit{value: wethAmount}();

        // 3. Approve both to the router.
        token.approve(router, testAmount);
        IWETH(weth).approve(router, wethAmount);

        // 4. Add liquidity (creates the pair on first add).
        IV2Router02(router).addLiquidity(
            address(token),
            weth,
            testAmount,
            wethAmount,
            0,
            0,
            me,
            block.timestamp + 3600
        );

        vm.stopBroadcast();

        address factory = IV2Router02(router).factory();
        address pair = IV2Factory(factory).getPair(address(token), weth);
        console2.log("TEST token:", address(token));
        console2.log("WETH:", weth);
        console2.log("Pair:", pair);
        console2.log("Seeded: quote TEST<->WETH through the adapter to verify routing.");
    }
}
