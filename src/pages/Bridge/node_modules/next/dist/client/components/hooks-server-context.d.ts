export declare class DynamicServerError extends Error {
    constructor(type: string);
}
export declare const CONTEXT_NAMES: {
    readonly HeadersContext: "HeadersContext";
    readonly PreviewDataContext: "PreviewDataContext";
    readonly CookiesContext: "CookiesContext";
    readonly StaticGenerationContext: "StaticGenerationContext";
    readonly FetchRevalidateContext: "FetchRevalidateContext";
};
export declare const HeadersContext: any;
export declare const PreviewDataContext: any;
export declare const CookiesContext: any;
export declare const StaticGenerationContext: any;
