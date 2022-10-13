export declare type ClientComponentImports = string[];
export declare type CssImports = Record<string, string[]>;
export declare type NextFlightClientEntryLoaderOptions = {
    modules: ClientComponentImports;
    /** This is transmitted as a string to `getOptions` */
    server: boolean | 'true' | 'false';
};
export default function transformSource(this: any): Promise<string>;
