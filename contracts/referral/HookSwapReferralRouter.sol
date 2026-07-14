// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import { Ownable } from "./Ownable.sol";
import { ReentrancyGuard } from "./library/ReentrancyGuard.sol";
import { IERC20 } from "./library/IERC20.sol";
import { SafeERC20 } from "./library/SafeERC20.sol";

/**
 * @dev Minimal Uniswap SwapRouter02 interface. Matches the on-chain SwapRouter02
 * `exactInputSingle` signature (single-hop v3 exact-input swap). HookSwap deploys
 * its own SwapRouter02 per chain — see contracts/deployments/<chain>.json
 * ("swapRouter02").
 */
interface ISwapRouter02 {
  struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
  }

  /// @dev SwapRouter02 omits the `deadline` field present in the original v3 SwapRouter.
  function exactInputSingle(ExactInputSingleParams calldata params)
    external
    payable
    returns (uint256 amountOut);
}

/**
 * @title HookSwapReferralRouter
 *
 * HookSwap's own on-chain referral / affiliate fee system. Partners register a
 * referral code mapped to a claim wallet. Swaps routed through this contract via
 * {swapExactInput} skim a small, capped fee (in the INPUT token) attributed to
 * the referral code; the swap remainder is forwarded to HookSwap's own
 * SwapRouter02 (v3 exact-input single-hop). Accrued fees are held per
 * (code, token) and later withdrawn with {claim} to the code's claim wallet.
 *
 * v1 scope: exact-input, single-hop, ERC-20 token in only. No native ETH, no
 * multi-hop. See README for follow-ups.
 *
 * SECURITY: Not audited. Needs a fresh audit before mainnet use.
 */
contract HookSwapReferralRouter is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  /// @dev Hard cap on the referral fee: 100 bps = 1%. `defaultFeeBps` can never exceed this.
  uint256 public constant MAX_FEE_BPS = 100;

  /// @dev Basis-points denominator.
  uint256 public constant BPS_DENOMINATOR = 10000;

  /// @dev HookSwap's own SwapRouter02 for this chain (immutable once deployed).
  ISwapRouter02 public immutable swapRouter02;

  /// @dev Fee applied (in bps) on the input token for registered referral codes.
  uint256 public defaultFeeBps;

  /// @dev Secondary fee administrator, in addition to the Ownable owner.
  address public feeAdmin;

  /// @dev code => wallet that receives claimed fees. address(0) == unregistered.
  mapping(bytes32 => address) public claimWalletOf;

  /// @dev code => token => amount accrued and claimable.
  mapping(bytes32 => mapping(address => uint256)) private _accrued;

  /// @dev token => total accrued across ALL codes (the amount the owner may NOT rescue).
  mapping(address => uint256) public totalAccrued;

  event CodeRegistered(bytes32 indexed code, address indexed claimWallet);
  event ClaimWalletUpdated(bytes32 indexed code, address indexed oldWallet, address indexed newWallet);
  event ReferralSwap(
    bytes32 indexed code,
    address indexed tokenIn,
    address indexed tokenOut,
    uint256 amountIn,
    uint256 fee
  );
  event FeesClaimed(bytes32 indexed code, address indexed token, uint256 amount, address indexed to);
  event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);
  event FeeAdminUpdated(address indexed oldAdmin, address indexed newAdmin);
  event TokenRescued(address indexed token, address indexed to, uint256 amount);

  /**
   * @param swapRouter02_ HookSwap's own SwapRouter02 for this chain
   *                      (contracts/deployments/<chain>.json "swapRouter02").
   * @param defaultFeeBps_ Initial referral fee in bps (must be <= MAX_FEE_BPS).
   * @param feeAdmin_ Secondary fee administrator (may be the same as the owner).
   */
  constructor(address swapRouter02_, uint256 defaultFeeBps_, address feeAdmin_) Ownable(_msgSender()) {
    require(swapRouter02_ != address(0), "Referral: router is zero");
    require(defaultFeeBps_ <= MAX_FEE_BPS, "Referral: fee exceeds cap");

    swapRouter02 = ISwapRouter02(swapRouter02_);
    defaultFeeBps = defaultFeeBps_;
    feeAdmin = feeAdmin_;

    emit FeeBpsUpdated(0, defaultFeeBps_);
    emit FeeAdminUpdated(address(0), feeAdmin_);
  }

  /// @dev Restricts to the Ownable owner OR the configured feeAdmin.
  modifier onlyFeeAdminOrOwner() {
    require(_msgSender() == _owner() || _msgSender() == feeAdmin, "Referral: not fee admin");
    _;
  }

  // ---------------------------------------------------------------------------
  // Fee configuration
  // ---------------------------------------------------------------------------

  /**
   * @notice Update the default referral fee (bps). Reverts if above MAX_FEE_BPS.
   */
  function setDefaultFeeBps(uint256 newFeeBps) external onlyFeeAdminOrOwner {
    require(newFeeBps <= MAX_FEE_BPS, "Referral: fee exceeds cap");
    uint256 old = defaultFeeBps;
    defaultFeeBps = newFeeBps;
    emit FeeBpsUpdated(old, newFeeBps);
  }

  /**
   * @notice Update the secondary fee administrator. Owner only.
   */
  function setFeeAdmin(address newAdmin) external onlyOwner {
    address old = feeAdmin;
    feeAdmin = newAdmin;
    emit FeeAdminUpdated(old, newAdmin);
  }

  // ---------------------------------------------------------------------------
  // Code registry
  // ---------------------------------------------------------------------------

  /**
   * @notice Register a referral code (first-come, first-served), caller-bound.
   * @dev The claim wallet is set to `msg.sender` — a registrant can only claim to
   * their own wallet, not point someone else's intended code at an attacker
   * wallet. Use {setClaimWallet} afterwards to redirect to a different wallet.
   * @param code Non-zero code identifier (e.g. keccak256 of a human string).
   */
  function registerCode(bytes32 code) external {
    require(code != bytes32(0), "Referral: zero code");
    require(claimWalletOf[code] == address(0), "Referral: code taken");

    claimWalletOf[code] = _msgSender();
    emit CodeRegistered(code, _msgSender());
  }

  /**
   * @notice The claim wallet for a code, or address(0) if unregistered.
   */
  function codeOwner(bytes32 code) external view returns (address) {
    return claimWalletOf[code];
  }

  /**
   * @notice Change the claim wallet for a code. Only the current claim wallet may call.
   */
  function setClaimWallet(bytes32 code, address newWallet) external {
    require(newWallet != address(0), "Referral: zero wallet");
    address current = claimWalletOf[code];
    require(current != address(0), "Referral: unregistered");
    require(_msgSender() == current, "Referral: not claim wallet");

    claimWalletOf[code] = newWallet;
    emit ClaimWalletUpdated(code, current, newWallet);
  }

  // ---------------------------------------------------------------------------
  // Referral swap (exact-input, single-hop, ERC-20 in)
  // ---------------------------------------------------------------------------

  /**
   * @notice Pull `amountIn` of `tokenIn` from the caller, skim the referral fee
   * (if `refCode` is registered), and forward the remainder through HookSwap's
   * SwapRouter02 as a v3 exact-input single-hop swap to `recipient`.
   *
   * If `refCode` is unregistered or zero, NO fee is taken (fee = 0) and the full
   * `amountIn` is swapped.
   *
   * @param tokenIn      Input ERC-20 token (pulled from msg.sender).
   * @param tokenOut     Output token.
   * @param feeTier      v3 pool fee tier (e.g. 500 / 3000 / 10000).
   * @param amountIn     Total input amount to pull from the caller.
   * @param amountOutMin Minimum acceptable output (slippage guard, on the swapped remainder).
   * @param recipient    Receiver of the swap output.
   * @param refCode      Referral code (bytes32(0) => no referral, no fee).
   * @return amountOut   Output amount returned by SwapRouter02.
   *
   * NOTE: fee-on-transfer / rebasing input tokens are UNSUPPORTED. Fee accrual and
   * the swap amount are computed off the nominal `amountIn`, but such tokens
   * deliver a different balance than requested — so the swap reverts (or the
   * downstream router pull fails) rather than mis-accruing referral fees. Only
   * standard fixed-supply ERC-20s should be routed through this function.
   */
  function swapExactInput(
    address tokenIn,
    address tokenOut,
    uint24 feeTier,
    uint256 amountIn,
    uint256 amountOutMin,
    address recipient,
    bytes32 refCode
  ) external nonReentrant returns (uint256 amountOut) {
    require(tokenIn != address(0), "Referral: tokenIn zero");
    require(recipient != address(0), "Referral: recipient zero");
    require(amountIn > 0, "Referral: amountIn zero");

    // 1. Pull the full input from the caller.
    IERC20(tokenIn).safeTransferFrom(_msgSender(), address(this), amountIn);

    // 2. Compute the fee. Only registered, non-zero codes accrue a fee.
    uint256 fee = 0;
    bool registered = refCode != bytes32(0) && claimWalletOf[refCode] != address(0);
    if (registered) {
      fee = (amountIn * defaultFeeBps) / BPS_DENOMINATOR;
    }

    // 3. Accrue the fee for later claim.
    if (fee > 0) {
      _accrued[refCode][tokenIn] += fee;
      totalAccrued[tokenIn] += fee;
    }

    uint256 swapAmount = amountIn - fee;

    // 4. Approve SwapRouter02 for exactly the swap amount and execute.
    //    Reset to 0 first for non-standard tokens (e.g. USDT) that require it.
    IERC20(tokenIn).safeApprove(address(swapRouter02), 0);
    IERC20(tokenIn).safeApprove(address(swapRouter02), swapAmount);

    amountOut = swapRouter02.exactInputSingle(
      ISwapRouter02.ExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: feeTier,
        recipient: recipient,
        amountIn: swapAmount,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0
      })
    );

    // 5. Reset approval to 0.
    IERC20(tokenIn).safeApprove(address(swapRouter02), 0);

    emit ReferralSwap(refCode, tokenIn, tokenOut, amountIn, fee);
  }

  // ---------------------------------------------------------------------------
  // Claims
  // ---------------------------------------------------------------------------

  /**
   * @notice Amount of `token` accrued and claimable for `code`.
   */
  function claimable(bytes32 code, address token) external view returns (uint256) {
    return _accrued[code][token];
  }

  /**
   * @notice Withdraw all accrued `token` fees for `code` to its claim wallet.
   * @dev Callable by anyone; funds always go to the registered claim wallet
   * (permissionless triggering, non-custodial destination). Zeroes the balance
   * before transfer (checks-effects-interactions) and is nonReentrant.
   */
  function claim(bytes32 code, address token) external nonReentrant {
    address to = claimWalletOf[code];
    require(to != address(0), "Referral: unregistered");

    uint256 amount = _accrued[code][token];
    require(amount > 0, "Referral: nothing to claim");

    _accrued[code][token] = 0;
    totalAccrued[token] -= amount;

    IERC20(token).safeTransfer(to, amount);

    emit FeesClaimed(code, token, amount, to);
  }

  // ---------------------------------------------------------------------------
  // Admin rescue
  // ---------------------------------------------------------------------------

  /**
   * @notice Rescue tokens accidentally sent to this contract. Owner only.
   * @dev Can only move the SURPLUS above `totalAccrued[token]`, so accrued
   * referral balances can never be drained by the admin.
   */
  function rescueToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
    require(to != address(0), "Referral: rescue to zero");

    uint256 balance = IERC20(token).balanceOf(address(this));
    uint256 locked = totalAccrued[token];
    uint256 surplus = balance > locked ? balance - locked : 0;
    require(amount <= surplus, "Referral: exceeds surplus");

    IERC20(token).safeTransfer(to, amount);
    emit TokenRescued(token, to, amount);
  }
}
