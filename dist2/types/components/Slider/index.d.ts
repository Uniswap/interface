/// <reference types="react" />
interface InputSliderProps {
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    size?: number;
}
export default function Slider({ value, onChange, min, step, max, size, ...rest }: InputSliderProps): JSX.Element;
export {};
