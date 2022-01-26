/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
interface BlockedTokenProps {
    onBack: (() => void) | undefined;
    onDismiss: (() => void) | undefined;
    blockedTokens: Token[];
}
declare const BlockedToken: ({ onBack, onDismiss, blockedTokens }: BlockedTokenProps) => JSX.Element;
export default BlockedToken;
