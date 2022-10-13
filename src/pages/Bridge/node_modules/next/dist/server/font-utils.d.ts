export declare type FontManifest = Array<{
    url: string;
    content: string;
}>;
export declare type FontConfig = boolean;
export declare function getFontDefinitionFromNetwork(url: string): Promise<string>;
export declare function getFontDefinitionFromManifest(url: string, manifest: FontManifest): string;
export declare function getFontOverrideCss(url: string, css: string): string;
