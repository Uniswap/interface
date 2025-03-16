import { NATIVE_CHAIN_ID } from "constants/tokens";
import { TARAXA_LOGO } from "ui/src/assets";
import { Chain } from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";

export enum TokenStandard {
  ERC20,
  ERC721,
}

export interface InteractiveToken {
  name: string;
  symbol: string;
  address: string;
  chain: Chain;
  standard: TokenStandard;
  color: string;
  logoUrl: string;
}

export const approvedERC20: InteractiveToken[] = [
  {
    name: "Taraxa",
    symbol: "TARA",
    address: NATIVE_CHAIN_ID,
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#15ab5c",
    logoUrl: TARAXA_LOGO,
  },
  {
    name: "Taraswap",
    symbol: "TSWAP",
    address: "0x712037beab9a29216650B8d032b4D9A59AF8AD6C",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#01b8b3",
    logoUrl:
      "https://raw.githubusercontent.com/taraswap/assets/main/logos/0x712037beab9a29216650B8d032b4D9A59AF8AD6C/logo.png",
  },
  {
    name: "Staked Taraxa",
    symbol: "stTARA",
    address: "0x37Df886BE517F9c75b27Cb70dac0D61432C92FBE",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#01b8b3",
    logoUrl:
      "https://raw.githubusercontent.com/taraswap/assets/main/logos/0x37Df886BE517F9c75b27Cb70dac0D61432C92FBE/logo.png",
  },
  {
    name: "Lara",
    symbol: "LARA",
    address: "0xE6A69cD4FF127ad8E53C21a593F7BaC4c608945e",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#01b8b3",
    logoUrl:
      "https://github.com/Lara-staking/visual-elements/blob/main/LARA_profile_Linkedin%20300x300.jpg?raw=true",
  },
  {
    name: "USDM Stablecoin",
    symbol: "USDM",
    address: "0xC26B690773828999c2612549CC815d1F252EA15e",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#01b8b3",
    logoUrl:
      "https://docs.meridianfinance.net/~gitbook/image?url=https%3A%2F%2F2791058162-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FznH0wmdBqe8s23j9vKpZ%252Ficon%252FUbuNuQudXb1BnT6HAme2%252Fmlogo.png%3Falt%3Dmedia%26token%3Dcdd3a8e5-fc46-444c-b604-d5b366b0b871&width=32&dpr=2&quality=100&sign=a305c8f5&sv=1",
  },
  {
    name: "ChadPu",
    symbol: "CHDPU",
    address: "0xaad94afea296dcf8c97d05dbf3733a245c3ea78f",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#CC7777",
    logoUrl:
      "https://raw.githubusercontent.com/taraswap/assets/main/logos/0xaad94Afea296DCF8c97D05dbf3733A245c3Ea78F/logo.png",
  },
];

export const approvedERC721: InteractiveToken[] = [
  // {
  //   name: "Unisocks",
  //   symbol: "SOCKS",
  //   address: "0x65770b5283117639760beA3F867b69b3697a91dd",
  //   chain: Chain.Ethereum,
  //   standard: TokenStandard.ERC721,
  //   color: "#CD237A",
  //   logoUrl:
  //     "https://i.seadn.io/gae/70fhKktz1h38x5pHR-DGxL4zP820_kSe5iVR_dDFXEo-etqbU5H_S-qfnvot7bd2AO7VzsRlgiU1AHYVtLfKaJZx?auto=format&dpr=1&w=384",
  // },
];
