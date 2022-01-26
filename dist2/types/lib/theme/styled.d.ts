import { keyframes as styledKeyframes, ThemedBaseStyledInterface, ThemedCssFunction, ThemeProviderComponent } from 'styled-components/macro';
import { ComputedTheme } from './theme';
declare const _default: ThemedBaseStyledInterface<ComputedTheme>;
export default _default;
export declare const css: ThemedCssFunction<ComputedTheme>;
export declare const keyframes: typeof styledKeyframes;
export declare const useTheme: () => ComputedTheme;
export declare const ThemedProvider: ThemeProviderComponent<ComputedTheme, ComputedTheme>;
