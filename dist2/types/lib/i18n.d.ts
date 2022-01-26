import { SupportedLocale } from 'constants/locales';
import { ReactNode } from 'react';
export declare function dynamicActivate(locale: SupportedLocale): Promise<void>;
interface ProviderProps {
    locale: SupportedLocale;
    forceRenderAfterLocaleChange?: boolean;
    onActivate?: (locale: SupportedLocale) => void;
    children: ReactNode;
}
export declare function Provider({ locale, forceRenderAfterLocaleChange, onActivate, children }: ProviderProps): JSX.Element;
export {};
