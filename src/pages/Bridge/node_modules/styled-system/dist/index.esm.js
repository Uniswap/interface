import { createStyleFunction, createParser } from '@styled-system/core'; // v4 api shims

import layout from '@styled-system/layout';
import color from '@styled-system/color';
import typography from '@styled-system/typography';
import flexbox from '@styled-system/flexbox';
import grid from '@styled-system/grid';
import border from '@styled-system/border';
import background from '@styled-system/background';
import position from '@styled-system/position';
export { get, createParser, createStyleFunction, compose, system } from '@styled-system/core';
export { margin, padding, space } from '@styled-system/space';
export { color } from '@styled-system/color';
export { layout } from '@styled-system/layout';
export { typography } from '@styled-system/typography';
export { flexbox } from '@styled-system/flexbox';
export { border } from '@styled-system/border';
export { background } from '@styled-system/background';
export { position } from '@styled-system/position';
export { grid } from '@styled-system/grid';
export { shadow } from '@styled-system/shadow';
export { default as boxShadow, default as textShadow } from '@styled-system/shadow';
export { variant, buttonStyle, textStyle, colorStyle } from '@styled-system/variant';
var width = layout.width,
    height = layout.height,
    minWidth = layout.minWidth,
    minHeight = layout.minHeight,
    maxWidth = layout.maxWidth,
    maxHeight = layout.maxHeight,
    size = layout.size,
    verticalAlign = layout.verticalAlign,
    display = layout.display,
    overflow = layout.overflow,
    overflowX = layout.overflowX,
    overflowY = layout.overflowY;
var opacity = color.opacity;
var fontSize = typography.fontSize,
    fontFamily = typography.fontFamily,
    fontWeight = typography.fontWeight,
    lineHeight = typography.lineHeight,
    textAlign = typography.textAlign,
    fontStyle = typography.fontStyle,
    letterSpacing = typography.letterSpacing;
var alignItems = flexbox.alignItems,
    alignContent = flexbox.alignContent,
    justifyItems = flexbox.justifyItems,
    justifyContent = flexbox.justifyContent,
    flexWrap = flexbox.flexWrap,
    flexDirection = flexbox.flexDirection,
    flex = flexbox.flex,
    flexGrow = flexbox.flexGrow,
    flexShrink = flexbox.flexShrink,
    flexBasis = flexbox.flexBasis,
    justifySelf = flexbox.justifySelf,
    alignSelf = flexbox.alignSelf,
    order = flexbox.order;
var gridGap = grid.gridGap,
    gridColumnGap = grid.gridColumnGap,
    gridRowGap = grid.gridRowGap,
    gridColumn = grid.gridColumn,
    gridRow = grid.gridRow,
    gridAutoFlow = grid.gridAutoFlow,
    gridAutoColumns = grid.gridAutoColumns,
    gridAutoRows = grid.gridAutoRows,
    gridTemplateColumns = grid.gridTemplateColumns,
    gridTemplateRows = grid.gridTemplateRows,
    gridTemplateAreas = grid.gridTemplateAreas,
    gridArea = grid.gridArea;
var borderWidth = border.borderWidth,
    borderStyle = border.borderStyle,
    borderColor = border.borderColor,
    borderTop = border.borderTop,
    borderRight = border.borderRight,
    borderBottom = border.borderBottom,
    borderLeft = border.borderLeft,
    borderRadius = border.borderRadius;
var backgroundImage = background.backgroundImage,
    backgroundSize = background.backgroundSize,
    backgroundPosition = background.backgroundPosition,
    backgroundRepeat = background.backgroundRepeat;
var zIndex = position.zIndex,
    top = position.top,
    right = position.right,
    bottom = position.bottom,
    left = position.left;
export { default as borders } from '@styled-system/border';
export { width, height, minWidth, minHeight, maxWidth, maxHeight, size, verticalAlign, display, overflow, overflowX, overflowY // color
, opacity // typography
, fontSize, fontFamily, fontWeight, lineHeight, textAlign, fontStyle, letterSpacing // flexbox
, alignItems, alignContent, justifyItems, justifyContent, flexWrap, flexDirection, flex, flexGrow, flexShrink, flexBasis, justifySelf, alignSelf, order // grid
, gridGap, gridColumnGap, gridRowGap, gridColumn, gridRow, gridAutoFlow, gridAutoColumns, gridAutoRows, gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gridArea // border
, borderWidth, borderStyle, borderColor, borderTop, borderRight, borderBottom, borderLeft, borderRadius // background
, backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat // position
, zIndex, top, right, bottom, left }; // v4 style API shim

export var style = function style(_ref) {
  var prop = _ref.prop,
      cssProperty = _ref.cssProperty,
      alias = _ref.alias,
      key = _ref.key,
      transformValue = _ref.transformValue,
      scale = _ref.scale,
      properties = _ref.properties;
  var config = {};
  config[prop] = createStyleFunction({
    properties: properties,
    property: cssProperty || prop,
    scale: key,
    defaultScale: scale,
    transform: transformValue
  });
  if (alias) config[alias] = config[prop];
  var parse = createParser(config);
  return parse;
};
