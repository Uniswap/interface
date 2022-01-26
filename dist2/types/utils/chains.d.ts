import { SupportedL1ChainId, SupportedL2ChainId } from 'constants/chains';
export declare function isL1ChainId(chainId: number | undefined): chainId is SupportedL1ChainId;
export declare function isL2ChainId(chainId: number | undefined): chainId is SupportedL2ChainId;
