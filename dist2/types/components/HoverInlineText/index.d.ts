/// <reference types="react" />
declare const HoverInlineText: ({ text, maxCharacters, margin, adjustSize, fontSize, textColor, link, ...rest }: {
    text?: string | undefined;
    maxCharacters?: number | undefined;
    margin?: boolean | undefined;
    adjustSize?: boolean | undefined;
    fontSize?: string | undefined;
    textColor?: string | undefined;
    link?: boolean | undefined;
}) => JSX.Element;
export default HoverInlineText;
