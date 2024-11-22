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
    name: "Herb",
    symbol: "HERB",
    address: "0x063f255689b00a877f6be55109b3eca24e266809",
    chain: Chain.Taraxa,
    standard: TokenStandard.ERC20,
    color: "#0c9e7d",
    logoUrl:
      "https://pbs.twimg.com/profile_images/1548683854113816583/NnOdHJVb_400x400.jpg",
  },
];

export const approvedERC721: InteractiveToken[] = [
  {
    name: "Unisocks",
    symbol: "SOCKS",
    address: "0x65770b5283117639760beA3F867b69b3697a91dd",
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: "#CD237A",
    logoUrl:
      "https://i.seadn.io/gae/70fhKktz1h38x5pHR-DGxL4zP820_kSe5iVR_dDFXEo-etqbU5H_S-qfnvot7bd2AO7VzsRlgiU1AHYVtLfKaJZx?auto=format&dpr=1&w=384",
  },
];
