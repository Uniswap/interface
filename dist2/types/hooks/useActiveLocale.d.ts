import { SupportedLocale } from 'constants/locales';
/**
 * Returns the supported locale read from the user agent (navigator)
 */
export declare function navigatorLocale(): SupportedLocale | undefined;
export declare const initialLocale: SupportedLocale;
/**
 * Returns the currently active locale, from a combination of user agent, query string, and user settings stored in redux
 * Stores the query string locale in redux (if set) to persist across sessions
 */
export declare function useActiveLocale(): SupportedLocale;
