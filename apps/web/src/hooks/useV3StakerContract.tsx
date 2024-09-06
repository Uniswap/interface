import { useContract } from "./useContract";
import UniswapV3StakerABI from "./UniswapV3StakerABI.json";

export const STAKER_ADDRESS = "0x3611731baC2F6891Dd222F6F47d9F6fAF7d72e30";

export function useV3StakerContract(withSignerIfPossible = true) {
  console.log("useV3StakerContract rerender");
  return useContract(STAKER_ADDRESS, UniswapV3StakerABI, withSignerIfPossible);
}
