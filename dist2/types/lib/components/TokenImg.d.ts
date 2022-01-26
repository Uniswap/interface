/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface TokenImgProps {
    className?: string;
    token: Currency;
}
declare function TokenImg({ className, token }: TokenImgProps): JSX.Element;
declare const _default: import("styled-components").StyledComponent<typeof TokenImg, import("../theme/theme").ComputedTheme, {
    size?: number | undefined;
}, never>;
export default _default;
