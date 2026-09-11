// oxlint-disable eslint-js/no-restricted-syntax -- Node-side script: process.env is the config surface here
/**
 * Launches a ZKPassport-gated demo auction on sepolia, end to end:
 *
 *   1. creates a policy on the ZKPassportCredentials registry (reuse one with POLICY_ID=0x…),
 *   2. deploys a stock ERC-1155 validation hook binding the registry to that
 *      policy's token id (reuse one with HOOK_ADDRESS=0x…),
 *   3. assembles the launcher multicall with buildOnchainCreateAuction and sends it,
 *
 * then prints the launched auction's bidder page URL. This replaces the creator
 * wizard for demo launches: the registry rework moved hook wiring out of the
 * registry, so the wizard's policy-picker flow no longer matches it.
 *
 *   read -s PRIVATE_KEY && export PRIVATE_KEY    # deployer key; spends gas only
 *   bun scripts/zkpassport-demo-launch.ts
 *
 * Optional env: RPC_URL, REGISTRY, TOKEN_NAME, TOKEN_SYMBOL, MIN_AGE,
 * POLICY_ID, HOOK_ADDRESS.
 */
import { PriceRangeStrategy } from "@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb";
import {
  type Address,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  type Hex,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { buildOnchainCreateAuction } from "../src/features/Toucan/ZkPassport/onchainLaunch";

/** ZKPassportCredentials registry on sepolia (deployments/11155111.json in zkpassport-packages). */
const DEFAULT_REGISTRY = "0x3278117D873965036B5e0007112ADDd488Bde3e1";

const AUCTION_CREATED_TOPIC =
  "0x7ede475fad18ccf0039f2b956c4d43a8b4ed0853de4daaa8ae25299f331ae3b9";

const registryAbi = [
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "salt", type: "bytes32" },
      { name: "requirements", type: "bytes" },
      { name: "credentialDuration", type: "uint64" },
      { name: "metadataURL", type: "string" },
      { name: "ownerIssuable", type: "bool" },
      { name: "ownerBannable", type: "bool" },
      { name: "ownerEditable", type: "bool" },
    ],
    outputs: [{ name: "policyId", type: "uint256" }],
  },
  {
    type: "event",
    name: "PolicyCreated",
    inputs: [
      { name: "policyId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
    ],
  },
] as const;

/** PolicyEvaluatorV1.PolicyRequirements, abi.encoded as createPolicy expects. */
const requirementsAbi = [
  {
    type: "tuple",
    components: [
      // NullifierType: NON_SALTED 0, SALTED 1, NON_SALTED_MOCK 2, SALTED_MOCK 3, NONE 4
      { name: "uniqueIdentifierType", type: "uint8" },
      { name: "enforceUniqueness", type: "bool" },
      { name: "minAge", type: "uint8" },
      // SanctionsMode: NONE 0, NORMAL 1, STRICT 2
      { name: "sanctionsMode", type: "uint8" },
      // FaceMatchMode: NONE 0, REGULAR 1, STRICT 2
      { name: "faceMatchMode", type: "uint8" },
      { name: "includedNationalities", type: "string[]" },
      { name: "excludedNationalities", type: "string[]" },
    ],
  },
] as const;

const hookAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_erc1155", type: "address" },
      { name: "_tokenId", type: "uint256" },
    ],
  },
] as const;

/**
 * Creation bytecode for the validation hook, compiled with solc 0.8.30
 * (optimizer on, 200 runs) from the source below — a functional replica of
 * Uniswap's stock BaseERC1155ValidationHook
 * (Uniswap/continuous-clearing-auction), erc1155()/tokenId() getters included,
 * which is the introspection surface useZkPassportGate reads:
 *
 *   // SPDX-License-Identifier: Apache-2.0
 *   pragma solidity 0.8.30;
 *
 *   interface IERC1155Balance {
 *       function balanceOf(address account, uint256 id) external view returns (uint256);
 *   }
 *
 *   contract ERC1155ValidationHook {
 *       error NotOwnerOfERC1155Token(uint256 tokenId);
 *       error SenderMustBeOwner();
 *
 *       IERC1155Balance public immutable erc1155;
 *       uint256 public immutable tokenId;
 *
 *       constructor(IERC1155Balance _erc1155, uint256 _tokenId) {
 *           erc1155 = _erc1155;
 *           tokenId = _tokenId;
 *       }
 *
 *       function validate(uint256, uint128, address owner, address sender, bytes calldata) external view {
 *           if (sender != owner) revert SenderMustBeOwner();
 *           if (erc1155.balanceOf(owner, tokenId) == 0) revert NotOwnerOfERC1155Token(tokenId);
 *       }
 *   }
 */
const hookBytecode: Hex =
  "0x60c060405234801561000f575f5ffd5b506040516103d13803806103d183398101604081905261002e91610044565b6001600160a01b0390911660805260a05261007b565b5f5f60408385031215610055575f5ffd5b82516001600160a01b038116811461006b575f5ffd5b6020939093015192949293505050565b60805160a0516103226100af5f395f818160480152818161012101526101c401525f81816097015261014701526103225ff3fe608060405234801561000f575f5ffd5b506004361061003f575f3560e01c806317d70f7c1461004357806322c44b5f1461007d578063d56022d714610092575b5f5ffd5b61006a7f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b61009061008b366004610217565b6100d1565b005b6100b97f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b039091168152602001610074565b836001600160a01b0316836001600160a01b03161461010357604051630d690a6360e21b815260040160405180910390fd5b604051627eeac760e11b81526001600160a01b0385811660048301527f000000000000000000000000000000000000000000000000000000000000000060248301527f0000000000000000000000000000000000000000000000000000000000000000169062fdd58e90604401602060405180830381865afa15801561018b573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101af91906102d5565b5f036101f457604051632a25988960e11b81527f0000000000000000000000000000000000000000000000000000000000000000600482015260240160405180910390fd5b505050505050565b80356001600160a01b0381168114610212575f5ffd5b919050565b5f5f5f5f5f5f60a0878903121561022c575f5ffd5b8635955060208701356fffffffffffffffffffffffffffffffff81168114610252575f5ffd5b9450610260604088016101fc565b935061026e606088016101fc565b9250608087013567ffffffffffffffff811115610289575f5ffd5b8701601f81018913610299575f5ffd5b803567ffffffffffffffff8111156102af575f5ffd5b8960208284010111156102c0575f5ffd5b60208201935080925050509295509295509295565b5f602082840312156102e5575f5ffd5b505191905056fea2646970667358221220528568298d1a21606f56c25c0c6bb06d9104a608a385f2b9bf7d446db57e7abb64736f6c634300081e0033";

function randomHex32(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  )}`;
}

async function main(): Promise<void> {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY is required (read -s PRIVATE_KEY && export PRIVATE_KEY)"
    );
  }
  const account = privateKeyToAccount(
    (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex
  );
  const registry = (process.env.REGISTRY ?? DEFAULT_REGISTRY) as Address;
  const transport = http(
    process.env.RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com"
  );
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport,
  });

  const log = console.log;

  log(`deployer ${account.address}`);
  log(`registry ${registry}`);

  let policyId: bigint;
  if (process.env.POLICY_ID) {
    policyId = BigInt(process.env.POLICY_ID);
    log(`policy   ${process.env.POLICY_ID} (reused)`);
  } else {
    const requirements = encodeAbiParameters(requirementsAbi, [
      {
        uniqueIdentifierType: 4, // NONE: nullifier type unconstrained, so dev-mode mock proofs pass
        enforceUniqueness: false,
        minAge: Number(process.env.MIN_AGE ?? 18),
        sanctionsMode: 0,
        faceMatchMode: 0,
        includedNationalities: [],
        excludedNationalities: [],
      },
    ]);
    const createHash = await walletClient.writeContract({
      address: registry,
      abi: registryAbi,
      functionName: "createPolicy",
      args: [
        randomHex32(),
        requirements,
        BigInt(30 * 24 * 60 * 60), // 30-day credentials
        "https://us-zkp.vercel.app/policy/18-plus",
        false,
        false,
        false,
      ],
    });
    log(`createPolicy sent: ${createHash}`);
    const createReceipt = await publicClient.waitForTransactionReceipt({
      hash: createHash,
    });
    const [created] = parseEventLogs({
      abi: registryAbi,
      eventName: "PolicyCreated",
      logs: createReceipt.logs,
    });
    if (!created) {
      throw new Error("createPolicy receipt has no PolicyCreated log");
    }
    policyId = created.args.policyId;
    log(`policy   0x${policyId.toString(16).padStart(64, "0")}`);
  }

  let hookAddress: Address;
  if (process.env.HOOK_ADDRESS) {
    hookAddress = process.env.HOOK_ADDRESS as Address;
    log(`hook     ${hookAddress} (reused)`);
  } else {
    const deployHash = await walletClient.deployContract({
      abi: hookAbi,
      bytecode: hookBytecode,
      args: [registry, policyId],
    });
    log(`hook deploy sent: ${deployHash}`);
    const deployReceipt = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    });
    if (!deployReceipt.contractAddress) {
      throw new Error("hook deployment receipt has no contract address");
    }
    hookAddress = deployReceipt.contractAddress;
    log(`hook     ${hookAddress}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const symbol = process.env.TOKEN_SYMBOL ?? `MV${now % 1000}`;
  const { transactions, predictedAuctionAddress } =
    await buildOnchainCreateAuction({
      request: {
        walletAddress: account.address,
        salt: randomHex32(),
        tokenInfo: {
          source: {
            case: "newToken" as const,
            value: {
              name: process.env.TOKEN_NAME ?? symbol,
              symbol,
              totalSupply: (10n ** 27n).toString(),
              metadata: { description: "ZKPassport demo launch", image: "" },
            },
          },
        },
        auction: {
          currencyAddress: "0x0000000000000000000000000000000000000000",
          startTimeUnix: BigInt(now + 600),
          endTimeUnix: BigInt(now + 15000),
          floorPriceRaisePerToken: "0.000000000278",
          auctionSupply: (10n ** 27n).toString(),
          validationHook: hookAddress,
        },
        pool: {
          fee: 3000,
          dynamicFee: false,
          priceRangeStrategy: PriceRangeStrategy.FULL_RANGE,
          customRanges: [],
          reservedSupplyForLp: (5n * 10n ** 26n).toString(),
          lpAllocation: {
            kind: { case: "singlePercent" as const, value: 100 },
          },
          poolOwner: account.address,
        },
      },
      chainId: sepolia.id,
      publicClient,
    });

  let auctionAddress: string | undefined;
  for (const tx of transactions) {
    const hash = await walletClient.sendTransaction({
      to: tx.to as Address,
      data: tx.data as Hex,
      value: tx.value,
    });
    log(`launch tx sent: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error(`launch transaction ${hash} reverted`);
    }
    const created = receipt.logs.find(
      (entry) => entry.topics[0] === AUCTION_CREATED_TOPIC
    );
    if (created?.topics[1]) {
      auctionAddress = `0x${created.topics[1].slice(-40)}`;
    }
  }
  // The AuctionCreated log is ground truth; the CREATE2 prediction can diverge
  // because the LBP strategy patches params/salt before deploying.
  const auction = auctionAddress ?? predictedAuctionAddress;

  log("");
  log("Launch complete");
  log(`  policy   0x${policyId.toString(16).padStart(64, "0")}`);
  log(`  hook     ${hookAddress}`);
  log(`  auction  ${auction}`);
  log(
    `  bidder   https://us-zkp.vercel.app/explore/auctions/ethereum_sepolia/${auction}`
  );
  log(
    `  (local:  http://localhost:3000/explore/auctions/ethereum_sepolia/${auction})`
  );
  log("  bidding opens ~10 minutes after launch");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
