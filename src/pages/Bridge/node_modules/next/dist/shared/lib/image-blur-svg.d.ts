/**
 * A shared function, used on both client and server, to generate a SVG blur placeholder.
 */
export declare function getImageBlurSvg({ widthInt, heightInt, blurWidth, blurHeight, blurDataURL, }: {
    widthInt?: number;
    heightInt?: number;
    blurWidth?: number;
    blurHeight?: number;
    blurDataURL: string;
}): string;
