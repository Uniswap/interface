export const getMaticTokenLogoURL = (address: string) => {
  let uri
  if (address?.toLowerCase() === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') {
    address = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
  }
  if (address?.toLowerCase() === '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063') {
    address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  }
  if (address?.toLowerCase() === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f') {
    address = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  }
  if (address?.toLowerCase() === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174') {
    address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  }

  if (address?.toLowerCase() === '0xb33eaad8d922b1083446dc23f610c2567fb5180f') {
    address = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
  }

  if (address?.toLowerCase() === '0xdb3b3b147a030f032633f6c4bebf9a2fb5a882b5') {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/assets/easyfi-token.png'
  }

  if (address?.toLowerCase() === '0x831753dd7087cac61ab5644b308642cc1c33dc13') {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/public/favicon.jpeg'
  }

  if (address?.toLowerCase() === '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6') {
    address = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  }

  if (address?.toLowerCase() === '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7') {
    uri = 'https://etherscan.io/token/images/AavegotchiGHST_32.png'
  }

  if (address?.toLowerCase() === '0x4ebde54ba404be158262ede801744b92b9878c61') {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/assets/easyfi-token.png'
  }

  if (address?.toLowerCase() === '0xa1c09c8f4f5d03fcc27b456475d53d988e98d7c5') {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/assets/easyfi-token.png'
  }

  if (address?.toLowerCase() === '0xfc39742fe9420a7af23757fc7e78d1c3ae4a9474') {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/assets/easyfi-token.png'
  }

  if (address?.toLowerCase() === '0x9f5755d47fb80100e7ee65bf7e136fca85dd9334') {
    uri = 'https://etherscan.io/token/images/om_32.png'
  }

  if (address?.toLowerCase() === '0x9719d867a500ef117cc201206b8ab51e794d3f82') {
    uri = 'https://aavegotchi.com/images/matokens/maUSDC.svg'
  }

  if (address?.toLowerCase() === '0xE0b22E0037B130A9F56bBb537684E6fA18192341'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maDAI.svg'
  }

  if (address?.toLowerCase() === '0x20D3922b4a1A8560E1aC99FBA4faDe0c849e2142'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maWETH.svg'
  }

  if (address?.toLowerCase() === '0x823CD4264C1b951C9209aD0DeAea9988fE8429bF'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maAAVE.svg'
  }

  if (address?.toLowerCase() === '0x98ea609569bD25119707451eF982b90E3eb719cD'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maLINK.svg'
  }

  if (address?.toLowerCase() === '0xDAE5F1590db13E3B40423B5b5c5fbf175515910b'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maUSDT.svg'
  }

  if (address?.toLowerCase() === '0xF4b8888427b00d7caf21654408B7CBA2eCf4EbD9'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maTUSD.svg'
  }

  if (address?.toLowerCase() === '0xe86E8beb7340659DDDCE61727E500e3A5aD75a90'.toLowerCase()) {
    uri = 'https://s2.gifyu.com/images/zutlogo.jpg'
  }

  if (address?.toLowerCase() === '0x104592a158490a9228070e0a8e5343b499e125d0'.toLowerCase()) {
    uri = 'https://avatars.githubusercontent.com/u/56005256?s=200&v=4'
  }

  if (address?.toLowerCase() === '0x9C78EE466D6Cb57A4d01Fd887D2b5dFb2D46288f'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/cometh_32.png'
  }

  if (address?.toLowerCase() === '0x127984b5E6d5c59f81DACc9F1C8b3Bdc8494572e'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/pepedex_32.png?v=2'
  }

  if (address?.toLowerCase() === '0x2a93172c8DCCbfBC60a39d56183B7279a2F647b4'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/assets/dg.jpg'
  }

  if (address?.toLowerCase() === '0x3e121107F6F22DA4911079845a470757aF4e1A1b'.toLowerCase()) {
    uri = 'https://avatars.githubusercontent.com/u/56005256?s=200&v=4'
  }

  if (address?.toLowerCase() === '0x104592a158490a9228070E0A8e5343B499e125D0'.toLowerCase()) {
    uri =
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x853d955aCEf822Db058eb8505911ED77F175b99e/logo.png'
  }

  if (address?.toLowerCase() === '0xab0b2ddB9C7e440fAc8E140A89c0dbCBf2d7Bbff'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/harvestfi/assets/main/farm-logo.png'
  }

  if (address?.toLowerCase() === '0x034b2090b579228482520c589dbD397c53Fc51cC'.toLowerCase()) {
    uri = 'https://s3-us-west-2.amazonaws.com/acf-uploads/apyvisionlogo200circle.png'
  }

  if (address?.toLowerCase() === '0x7FBc10850caE055B27039aF31bD258430e714c62'.toLowerCase()) {
    uri = 'https://assets.coingecko.com/coins/images/2707/small/UnibrightLogo_colorful_500x500_preview.png?1547036916'
  }

  if (address?.toLowerCase() === '0x0e59D50adD2d90f5111aca875baE0a72D95B4762'.toLowerCase()) {
    uri = 'https://dark-build.app/logo192.png'
  }

  if (address?.toLowerCase() === '0x3809dcDd5dDe24B37AbE64A5a339784c3323c44F'.toLowerCase()) {
    uri = 'https://i.imgur.com/vZnU36G.png'
  }

  if (address?.toLowerCase() === '0x23D29D30e35C5e8D321e1dc9A8a61BFD846D4C5C'.toLowerCase()) {
    uri = 'https://hex.com/favicon.png'
  }

  if (address?.toLowerCase() === '0x07738Eb4ce8932CA961c815Cb12C9d4ab5Bd0Da4'.toLowerCase()) {
    uri = 'https://etherlegends.com/ELET.png'
  }

  if (address?.toLowerCase() === '0x8d1566569d5b695d44a9a234540f68D393cDC40D'.toLowerCase()) {
    uri = 'https://i.imgur.com/IIUglm9.png?1'
  }

  if (address?.toLowerCase() === '0x66768ad00746aC4d68ded9f64886d55d5243f5Ec'.toLowerCase()) {
    uri = 'https://rebalancetoken.io/images/logo/logo.png'
  }

  if (address?.toLowerCase() === '0x8c8bdBe9CeE455732525086264a4Bf9Cf821C498'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maUNI.svg'
  }

  if (address?.toLowerCase() === '0xe20f7d1f0eC39C4d5DB01f53554F2EF54c71f613'.toLowerCase()) {
    uri = 'https://aavegotchi.com/images/matokens/maYFI.svg'
  }

  if (address?.toLowerCase() === '0x840195888Db4D6A99ED9F73FcD3B225Bb3cB1A79'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/assets/sx.jpg'
  }

  if (address?.toLowerCase() === '0xe6fc6c7cb6d2c31b359a49a33ef08ab87f4de7ce') {
    uri = 'https://assets.coingecko.com/coins/images/7697/small/N7aEdYrY_400x400.png?1561587437'
  }

  if (address?.toLowerCase() === '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39') {
    address = '0x514910771AF9Ca656af840dff83E8264EcF986CA'
  }

  if (address?.toLowerCase() === '0x71b821aa52a49f32eed535fca6eb5aa130085978') {
    address = '0xB6eD7644C69416d67B522e20bC294A9a9B405B31'
  }

  if (address?.toLowerCase() === '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4') {
    address = '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
  }

  if (address?.toLowerCase() === '0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c') {
    address = '0xc00e94Cb662C3520282E6f5717214004A7f26888'
  }

  if (address?.toLowerCase() === '0x313d009888329c9d1cf4f75ca3f32566335bd604') {
    address = '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03'
  }

  if (address?.toLowerCase() === '0xda537104d6a5edd53c6fbba9a898708e465260b6') {
    address = '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
  }

  if (address?.toLowerCase() === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') {
    address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  }

  if (address?.toLowerCase() === '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39'.toLowerCase()) {
    uri =
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png'
  }

  if (address?.toLowerCase() === '0xC3Ec80343D2bae2F8E680FDADDe7C17E71E114ea'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/mantradao_32.png'
  }

  if (address?.toLowerCase() === '0xf28164A485B0B2C90639E47b0f377b4a438a16B1'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/public/favicon.jpeg'
  }

  if (address?.toLowerCase() === '0xd85d1e945766fea5eda9103f918bd915fbca63e6'.toLowerCase()) {
    uri = 'https://assets.coingecko.com/coins/images/3263/small/CEL_logo.png?1609598753'
  }

  if (address?.toLowerCase() === '0x46F48FbdedAa6F5500993BEDE9539ef85F4BeE8e'.toLowerCase()) {
    uri = 'https://aria.fyi/images/Aria_Logo_256.png'
  }

  if (address?.toLowerCase() === '0xeCf8f2FA183b1C4d2A269BF98A54fCe86C812d3e'.toLowerCase()) {
    uri = 'https://i.imgur.com/Z8V1O7H.png'
  }

  if (address?.toLowerCase() === '0xa1428174F516F527fafdD146b883bB4428682737'.toLowerCase()) {
    uri = 'https://assets.coingecko.com/coins/images/14040/small/6YPdWn6.png?1613975899'
  }

  if (address?.toLowerCase() === '0x42435F467D33e5C4146a4E8893976ef12BBCE762'.toLowerCase()) {
    uri = 'https://i.imgur.com/uVGtugL.png'
  }

  if (address?.toLowerCase() === '0x7CdC0421469398e0F3aA8890693d86c840Ac8931'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/assets/azuki.png'
  }

  if (address?.toLowerCase() === '0xd28449BB9bB659725aCcAd52947677ccE3719fD7'.toLowerCase()) {
    uri = 'https://darkmatter.finance/i/favicon/512x512.png'
  }

  if (address?.toLowerCase() === '0x8a2870fb69A90000D6439b7aDfB01d4bA383A415'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/assets/DEGEN_LOGO.png'
  }

  if (address?.toLowerCase() === '0x521CddC0CBa84F14c69C1E99249F781AA73Ee0BC'.toLowerCase()) {
    uri = 'https://assets.coingecko.com/coins/images/13719/small/hh.png?1611137626'
  }

  if (address?.toLowerCase() === '0x6968105460f67c3BF751bE7C15f92F5286Fd0CE5'.toLowerCase()) {
    uri = 'https://i.imgur.com/FR12tmm.jpg'
  }

  if (address?.toLowerCase() === '0x9c49BA0212Bb5Db371e66b59D1565b7c06E4894e'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/indexed-cc10_32.png'
  }

  if (address?.toLowerCase() === '0x282d8efCe846A88B159800bd4130ad77443Fa1A1'.toLowerCase()) {
    uri = 'https://oceanprotocol.com/static/4ad704a150d436a1f32d495413fc47cd/favicon-white.png'
  }

  if (address?.toLowerCase() === '0x232eaB56c4fB3f84c6Fb0a50c087c74b7B43c6Ad'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/zuzprotocol_32.png'
  }

  if (address?.toLowerCase() === '0xFdc26CDA2d2440d0E83CD1DeE8E8bE48405806DC'.toLowerCase()) {
    uri =
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xb683D83a532e2Cb7DFa5275eED3698436371cc9f/logo.png'
  }

  if (address?.toLowerCase() === '0xB77e62709e39aD1cbeEBE77cF493745AeC0F453a'.toLowerCase()) {
    uri = 'https://i.imgur.com/eOOhNeh.png'
  }

  if (address?.toLowerCase() === '0xB77e62709e39aD1cbeEBE77cF493745AeC0F453a'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/wisetoken_32.png'
  }

  if (address?.toLowerCase() === '0x82B6205002ecd05e97642D38D61e2cFeaC0E18cE'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/deflect_32.png?=v1'
  }

  if (address?.toLowerCase() === '0xf153EfF70DC0bf3b085134928daeEA248d9B30d0'.toLowerCase()) {
    uri =
      'https://raw.githubusercontent.com/trustwallet/assets/8cb78aca77b340510958ed98a3cd260d2d7f0420/blockchains/ethereum/assets/0x36b679bd64Ed73DBfd88909cDCB892cB66Bd4CBb/logo.png'
  }

  if (address?.toLowerCase() === '0xa0E390e9ceA0D0e8cd40048ced9fA9EA10D71639'.toLowerCase()) {
    uri = 'https://storage.googleapis.com/stacktical-public/dsla.png'
  }

  if (address?.toLowerCase() === '0xFeD16c746CB5BFeD009730f9E3e6A673006105c7'.toLowerCase()) {
    uri = 'https://pbs.twimg.com/profile_images/1318783238291292160/R4DxXdRA_400x400.jpg'
  }

  if (address?.toLowerCase() === '0x8f18dC399594b451EdA8c5da02d0563c0b2d0f16'.toLowerCase()) {
    uri = 'https://i.imgur.com/UIjlQpC.png'
  }
  if (address?.toLowerCase() === '0x033d942A6b495C4071083f4CDe1f17e986FE856c'.toLowerCase()) {
    uri = 'https://i.imgur.com/R0aQlym.png'
  }
  if (address?.toLowerCase() === '0xF84BD51eab957c2e7B7D646A3427C5A50848281D'.toLowerCase()) {
    uri = 'https://i.imgur.com/06BkcTT.png'
  }
  if (address?.toLowerCase() === '0x23D29D30e35C5e8D321e1dc9A8a61BFD846D4C5C'.toLowerCase()) {
    uri = 'https://hex.com/favicon.png'
  }

  if (address?.toLowerCase() === '0x2727Ab1c2D22170ABc9b595177B2D5C6E1Ab7B7B'.toLowerCase()) {
    uri = 'https://i.imgur.com/q3SnElh.png'
  }

  if (address?.toLowerCase() === '0xdF7837DE1F2Fa4631D716CF2502f8b230F1dcc32'.toLowerCase()) {
    uri = 'https://pbs.twimg.com/profile_images/933388441475194881/57fOk40N_400x400.jpg'
  }
  if (address?.toLowerCase() === '0x7075cAB6bCCA06613e2d071bd918D1a0241379E2'.toLowerCase()) {
    uri = 'https://gains.farm/images/logo256.png'
  }
  if (address?.toLowerCase() === '0xf7d9e281c5Cb4C6796284C5b663b3593D2037aF2'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/sameepsi/quickswap-default-token-list/master/assets/NFTP.png'
  }

  if (address?.toLowerCase() === '0xD6DF932A45C0f255f85145f286eA0b292B21C90B'.toLowerCase()) {
    uri = 'https://etherscan.io/token/images/aave_32.png'
  }
  if (address?.toLowerCase() === '0x2bF9b864cdc97b08B6D79ad4663e71B8aB65c45c'.toLowerCase()) {
    uri = 'https://cryptologos.cc/logos/fusion-fsn-logo.png?v=010'
  }
  if (address?.toLowerCase() === '0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8'.toLowerCase()) {
    uri = 'https://raw.githubusercontent.com/anyswap/Brand-assets/master/logo/c-128-white.svg'
  }
  if (address?.toLowerCase() === '0xe82808eaA78339b06a691fd92E1Be79671cAd8D3'.toLowerCase()) {
    uri = 'https://i.imgur.com/nQDG9AQ.png'
  }
  if (address?.toLowerCase() === '0x7ff2FC33E161E3b1C6511B934F0209D304267857'.toLowerCase()) {
    uri = 'https://www.opucoin.io/wp-content/uploads/2021/04/opu-coiin-icon-border.svg'
  }
  if (address?.toLowerCase() === '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a'.toLowerCase()) {
    address = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2'
  }
  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  }

  return uri
}
