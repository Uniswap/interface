import { SupportedLocale } from 'constants/locales';
import { LocationDescriptor } from 'history';
export declare function useLocationLinkProps(locale: SupportedLocale | null): {
    to?: LocationDescriptor;
    onClick?: () => void;
};
