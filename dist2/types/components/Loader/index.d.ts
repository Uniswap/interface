/// <reference types="react" />
/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
export default function Loader({ size, stroke, ...rest }: {
    size?: string;
    stroke?: string;
    [k: string]: any;
}): JSX.Element;
