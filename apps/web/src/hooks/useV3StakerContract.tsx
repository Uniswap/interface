import { useContract } from "./useContract";
import UniswapV3StakerABI from "./UniswapV3StakerABI.json";

export const STAKER_ADDRESS = "0xC7053cE28997b23541bfF8B4B555655c06db584D";

export function useV3StakerContract(withSignerIfPossible = true) {
  return useContract(STAKER_ADDRESS, UniswapV3StakerABI, withSignerIfPossible);
}
