import React from "react";
import styled from "styled-components";

interface DonutChartProps {
  data: {
    value: number;
    color: string;
  }[];
  size?: number;
  thickness?: number;
}

const SVGContainer = styled.svg`
  transform: rotate(-90deg);
`;

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 120,
  thickness = 12,
}) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - thickness / 2);
  let currentOffset = 0;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <SVGContainer width={size} height={size}>
      {data.map((item, index) => {
        const percentage = item.value / total;
        const strokeDasharray = `${circumference * percentage} ${
          circumference * (1 - percentage)
        }`;
        const pathDefinition = `
          M ${size / 2}, ${size / 2}
          m 0, ${-radius + thickness / 2}
          a ${radius - thickness / 2},${radius - thickness / 2} 0 1,1 0,${
          2 * (radius - thickness / 2)
        }
          a ${radius - thickness / 2},${radius - thickness / 2} 0 1,1 0,${
          -2 * (radius - thickness / 2)
        }
        `;

        const path = (
          <path
            key={index}
            d={pathDefinition}
            stroke={item.color}
            strokeWidth={thickness}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={-currentOffset}
            fill="none"
          />
        );

        currentOffset += circumference * percentage;
        return path;
      })}
    </SVGContainer>
  );
};

export default DonutChart;
