import HolidayUniIcon from "components/Logo/HolidayUniIcon";
import { SVGProps } from "components/Logo/UniIcon";
import styled from "styled-components";

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="42"
      height="42"
      viewBox="0 0 100 100"
      fill="none"
      onClick={onClick}
      cursor="pointer"
    >
      <g>
        <path
          className="cls-2"
          fill="#15ab5a"
          d="m73.22,35.37l-10.97,18.45h-22.54l7.49-13.15h8.56l5.49-9.85H18.89l-6.9,11.02-.08.13-.05-.13L3.14,20.64,36.04,0l-6.36,11.81h28.5c12.01,0,20.7,12.97,15.04,23.56Z"
        />
        <path
          className="cls-2"
          fill="#15ab5a"
          d="m38.06,95.65l6.37-11.81H15.92c-12.01,0-19.68-12.8-14.02-23.39l9.95-18.62h18.17l-10.55,20.43c-.65,1.15.17,2.57,1.5,2.57h34.24l6.89-11.02.08-.13.05.13,8.74,21.2-32.91,20.64Z"
        />
      </g>
    </svg>
  );
}

const Container = styled.div<{ clickable?: boolean }>`
  position: relative;
  cursor: ${({ clickable }) => (clickable ? "pointer" : "auto")};
  display: flex;
  justify-content: center;
  align-items: center;
`;

type NavIconProps = SVGProps & {
  clickable?: string;
  onClick?: () => void;
};

export const NavIcon = ({ clickable, onClick, ...props }: NavIconProps) => (
  <Container clickable={clickable === "true"}>
    {HolidayUniIcon(props) !== null ? (
      <HolidayUniIcon {...props} />
    ) : (
      <Logo onClick={onClick} />
    )}
  </Container>
);
