/// <reference types="react" />
declare const VALID_LOADING_VALUES: readonly ["lazy", "eager", undefined];
declare type LoadingValue = typeof VALID_LOADING_VALUES[number];
export declare type ImageLoader = (p: ImageLoaderProps) => string;
export declare type ImageLoaderProps = {
    src: string;
    width: number;
    quality?: number;
};
declare type PlaceholderValue = 'blur' | 'empty';
declare type OnLoadingComplete = (img: HTMLImageElement) => void;
export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
}
interface StaticRequire {
    default: StaticImageData;
}
declare type StaticImport = StaticRequire | StaticImageData;
export declare type ImageProps = Omit<JSX.IntrinsicElements['img'], 'src' | 'srcSet' | 'ref' | 'alt' | 'width' | 'height' | 'loading'> & {
    src: string | StaticImport;
    alt: string;
    width?: number | string;
    height?: number | string;
    fill?: boolean;
    loader?: ImageLoader;
    quality?: number | string;
    priority?: boolean;
    loading?: LoadingValue;
    placeholder?: PlaceholderValue;
    blurDataURL?: string;
    unoptimized?: boolean;
    onLoadingComplete?: OnLoadingComplete;
};
export default function Image({ src, sizes, unoptimized, priority, loading, className, quality, width, height, fill, style, onLoadingComplete, placeholder, blurDataURL, ...all }: ImageProps): JSX.Element;
export {};
