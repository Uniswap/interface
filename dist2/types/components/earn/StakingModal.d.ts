/// <reference types="react" />
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { StakingInfo } from '../../state/stake/hooks';
interface StakingModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    stakingInfo: StakingInfo;
    userLiquidityUnstaked: CurrencyAmount<Token> | undefined;
}
export default function StakingModal({ isOpen, onDismiss, stakingInfo, userLiquidityUnstaked }: StakingModalProps): JSX.Element;
export {};
