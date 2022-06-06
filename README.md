# Uniswap Labs Interface

[![Unit Tests](https://github.com/Uniswap/interface/actions/workflows/unit-tests.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/unit-tests.yaml)
[![Integration Tests](https://github.com/Uniswap/interface/actions/workflows/integration-tests.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/integration-tests.yaml)
[![Lint](https://github.com/Uniswap/interface/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/lint.yml)
[![Release](https://github.com/Uniswap/interface/actions/workflows/release.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/release.yaml)
[![Crowdin](https://badges.crowdin.net/uniswap-interface/localized.svg)](https://crowdin.com/project/uniswap-interface)

An open source interface for Uniswap -- a protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.org](https://uniswap.org/)
- Interface: [app.uniswap.org](https://app.uniswap.org)
- Docs: [uniswap.org/docs/](https://docs.uniswap.org/)
- Twitter: [@Uniswap](https://twitter.com/Uniswap)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.gg/FCfyBSbCU5)
- Whitepapers:
  - [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)
  - [V2](https://uniswap.org/whitepaper.pdf)
  - [V3](https://uniswap.org/whitepaper-v3.pdf)

## Accessing the Uniswap Interface

To access the Uniswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Unsupported tokens

Check out `useUnsupportedTokenList()` in [src/state/lists/hooks.ts](./src/state/lists/hooks.ts) for blocking tokens in your instance of the interface.

You can block an entire list of tokens by passing in a tokenlist like [here](./src/constants/lists.ts) or you can block specific tokens by adding them to [unsupported.tokenlist.json](./src/constants/tokenLists/unsupported.tokenlist.json).

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).

## Accessing Uniswap V2

The Uniswap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for Uniswap protocol V2.

- Swap on Uniswap V2: https://app.uniswap.org/#/swap?use=v2
- View V2 liquidity: https://app.uniswap.org/#/pool/v2
- Add V2 liquidity: https://app.uniswap.org/#/add/v2
- Migrate V2 liquidity to V3: https://app.uniswap.org/#/migrate/v2

## Accessing Uniswap V1

The Uniswap V1 interface for mainnet and testnets is accessible via IPFS gateways
linked from the [v1.0.0 release](https://github.com/Uniswap/uniswap-interface/releases/tag/v1.0.0).


Deployed Addresses / Contracts on CANDLE:
Step 1 complete [
  {
    message: 'Contract UniswapV3Factory deployed',
    address: '0x5Bb7BAE25728e9e51c25466D2A15FaE97834FD95',
    hash: '0xd82c344b10d43bb2e2998069d9b47afcb1cfbdb7db3e52d8e185fdd42954182c'
  }
]
Step 2 complete [
  {
    message: 'UniswapV3Factory added a new fee tier 1 bps with tick spacing 1',
    hash: '0xbb13d12313cab9ef0ff94919cc8318617a1b317b566e7336c6745b949e8be322'
  }
]
Step 3 complete [
  {
    message: 'Contract UniswapInterfaceMulticall deployed',
    address: '0x5CE8A0aE761591697E1ced46e3f3C794b1fd7A29',
    hash: '0xab6405a0a2c3e4d9e36773ac047a3cfad3c7364de8d99ddf535a9cec1de19a0c'
  }
]
Step 4 complete [
  {
    message: 'Contract ProxyAdmin deployed',
    address: '0xc0e321497Bb84Daa4Fd00362A87C2be53B9e0b7d',
    hash: '0xe93a18d38b7ae58e0814fa17df1913b136f06a9c156b55c43a0e9cc94492df49'
  }
]
Step 5 complete [
  {
    message: 'Contract TickLens deployed',
    address: '0xe740AB2582bc8654F5F12a3cAfbE9DB4B95E6EC3',
    hash: '0x6c504b2bb4e8b2ea422692e45eec9fcf51223ff92c0d62bfde72b3e1cc7bec60'
  }
]
Step 6 complete [
  {
    message: 'Library NFTDescriptor deployed',
    address: '0xDc167A083C5bef9b8e8871caE444CE145BF4d07e',
    hash: '0xe074525242c125143d5bb6194d9f6ba7307527eb59ed76dc9f9e38027b60803b'
  }
]
Step 7 complete [
  {
    message: 'Contract NonfungibleTokenPositionDescriptor deployed',
    address: '0x0726214fc4E0567C927209C1f711Ff46136484dE',
    hash: '0xd6760e4a3ee1729b272472412c4d448c8b3e599154707292b5b51c29fc311f01'
  }
]
Step 8 complete [
  {
    message: 'Contract TransparentUpgradeableProxy deployed',
    address: '0x8F31C82DA35D031f92c0707c0430BeFC5Fc582a2',
    hash: '0x27c4df983e5b60bc9005653bcbeec0e2cbfb63acc506678ac14be4e946f1eab3'
  }
]
Step 9 complete [
  {
    message: 'Contract NonfungiblePositionManager deployed',
    address: '0xB307B497aF3fDDF68c27ce0356876dC6b88602D7',
    hash: '0xfcb93703ba5d3b2c88eba249938805be07c3605996186ca14b5729307307d424'
  }
]
Step 10 complete [
  {
    message: 'Contract V3Migrator deployed',
    address: '0x91D79A8f1dbAed2163E27236e11f507C4b358552',
    hash: '0x9b84088821764d24dd0b83626f9a6f4b265cc2f9e1b2e9e1d3bd61a1fb7afd19'
  }
]
Step 11 complete [
  {
    message: 'UniswapV3Factory owned by 0x546D090bbcEC3d96903d41e38C3436c1C601AF9c already'
  }
]
Step 12 complete [
  {
    message: 'Contract UniswapV3Staker deployed',
    address: '0x1C8EBc10A8bE19BeF1e697bF0916f3473110F00d',
    hash: '0x6ba4dda62e8a5ec9f70d9b660669213e014384b30a7f190913a6fe1b6df46e55'
  }
]
Step 13 complete [
  {
    message: 'Contract Quoter deployed',
    address: '0x4F761C4864dCd0512A56Fe1020F64751791938cc',
    hash: '0xca72848ef5a0dec5b037964a73162e31c6dda3acb0a11528f086ba7484ed7f50'
  }
]
Step 14 complete [
  {
    message: 'Contract QuoterV2 deployed',
    address: '0xEb9a81A2eDA6cdC61a09c9F56Ab86510A820e55b',
    hash: '0xcea57208391af1513fbb0f0556da1770187ad4651582a77cb71c64145285f1a7'
  }
]
Step 15 complete [
  {
    message: 'Contract SwapRouter02 deployed',
    address: '0x1a45c9f823F64c9360b0c3df269F824cf404f82b',
    hash: '0x85e84c66f4a543a888be4e2025d4e0b1b2f1afdedf09e597f17ddfdba9b9fe5c'
  }
]
Step 16 complete [
  {
    message: 'ProxyAdmin owned by 0x546D090bbcEC3d96903d41e38C3436c1C601AF9c already'
  }
]
Deployment succeeded
[[{"message":"Contract UniswapV3Factory deployed","address":"0x5Bb7BAE25728e9e51c25466D2A15FaE97834FD95","hash":"0xd82c344b10d43bb2e2998069d9b47afcb1cfbdb7db3e52d8e185fdd42954182c"}],
 [{"message":"UniswapV3Factory added a new fee tier 1 bps with tick spacing 1","hash":"0xbb13d12313cab9ef0ff94919cc8318617a1b317b566e7336c6745b949e8be322"}],
 [{"message":"Contract UniswapInterfaceMulticall deployed","address":"0x5CE8A0aE761591697E1ced46e3f3C794b1fd7A29","hash":"0xab6405a0a2c3e4d9e36773ac047a3cfad3c7364de8d99ddf535a9cec1de19a0c"}],
 [{"message":"Contract ProxyAdmin deployed","address":"0xc0e321497Bb84Daa4Fd00362A87C2be53B9e0b7d","hash":"0xe93a18d38b7ae58e0814fa17df1913b136f06a9c156b55c43a0e9cc94492df49"}],
 [{"message":"Contract TickLens deployed","address":"0xe740AB2582bc8654F5F12a3cAfbE9DB4B95E6EC3","hash":"0x6c504b2bb4e8b2ea422692e45eec9fcf51223ff92c0d62bfde72b3e1cc7bec60"}],
 [{"message":"Library NFTDescriptor deployed","address":"0xDc167A083C5bef9b8e8871caE444CE145BF4d07e","hash":"0xe074525242c125143d5bb6194d9f6ba7307527eb59ed76dc9f9e38027b60803b"}],
 [{"message":"Contract NonfungibleTokenPositionDescriptor deployed","address":"0x0726214fc4E0567C927209C1f711Ff46136484dE","hash":"0xd6760e4a3ee1729b272472412c4d448c8b3e599154707292b5b51c29fc311f01"}]
 ,[{"message":"Contract TransparentUpgradeableProxy deployed","address":"0x8F31C82DA35D031f92c0707c0430BeFC5Fc582a2","hash":"0x27c4df983e5b60bc9005653bcbeec0e2cbfb63acc506678ac14be4e946f1eab3"}],
 [{"message":"Contract NonfungiblePositionManager deployed","address":"0xB307B497aF3fDDF68c27ce0356876dC6b88602D7","hash":"0xfcb93703ba5d3b2c88eba249938805be07c3605996186ca14b5729307307d424"}],
 [{"message":"Contract V3Migrator deployed","address":"0x91D79A8f1dbAed2163E27236e11f507C4b358552","hash":"0x9b84088821764d24dd0b83626f9a6f4b265cc2f9e1b2e9e1d3bd61a1fb7afd19"}],
 [{"message":"UniswapV3Factory owned by 0x546D090bbcEC3d96903d41e38C3436c1C601AF9c already"}],[{"message":"Contract UniswapV3Staker deployed","address":"0x1C8EBc10A8bE19BeF1e697bF0916f3473110F00d","hash":"0x6ba4dda62e8a5ec9f70d9b660669213e014384b30a7f190913a6fe1b6df46e55"}],
 [{"message":"Contract Quoter deployed","address":"0x4F761C4864dCd0512A56Fe1020F64751791938cc","hash":"0xca72848ef5a0dec5b037964a73162e31c6dda3acb0a11528f086ba7484ed7f50"}],
 [{"message":"Contract QuoterV2 deployed","address":"0xEb9a81A2eDA6cdC61a09c9F56Ab86510A820e55b","hash":"0xcea57208391af1513fbb0f0556da1770187ad4651582a77cb71c64145285f1a7"}],
 [{"message":"Contract SwapRouter02 deployed","address":"0x1a45c9f823F64c9360b0c3df269F824cf404f82b","hash":"0x85e84c66f4a543a888be4e2025d4e0b1b2f1afdedf09e597f17ddfdba9b9fe5c"}],
 [{"message":"ProxyAdmin owned by 0x546D090bbcEC3d96903d41e38C3436c1C601AF9c already"}]]

Final state

{
  "v3CoreFactoryAddress":"0x5Bb7BAE25728e9e51c25466D2A15FaE97834FD95",
 "multicall2Address":"0x5CE8A0aE761591697E1ced46e3f3C794b1fd7A29",
 "proxyAdminAddress":"0xc0e321497Bb84Daa4Fd00362A87C2be53B9e0b7d",
 "tickLensAddress":"0xe740AB2582bc8654F5F12a3cAfbE9DB4B95E6EC3",
 "nftDescriptorLibraryAddressV1_3_0":"0xDc167A083C5bef9b8e8871caE444CE145BF4d07e",
 "nonfungibleTokenPositionDescriptorAddressV1_3_0":"0x0726214fc4E0567C927209C1f711Ff46136484dE",
 "descriptorProxyAddress":"0x8F31C82DA35D031f92c0707c0430BeFC5Fc582a2",
 "nonfungibleTokenPositionManagerAddress":"0xB307B497aF3fDDF68c27ce0356876dC6b88602D7",
 "v3MigratorAddress":"0x91D79A8f1dbAed2163E27236e11f507C4b358552",
 "v3StakerAddress":"0x1C8EBc10A8bE19BeF1e697bF0916f3473110F00d",
 "quoterAddress":"0x4F761C4864dCd0512A56Fe1020F64751791938cc",
 "quoterV2Address":"0xEb9a81A2eDA6cdC61a09c9F56Ab86510A820e55b",
 "swapRouter02":"0x1a45c9f823F64c9360b0c3df269F824cf404f82b"
}
