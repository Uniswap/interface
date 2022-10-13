import _extends from "@babel/runtime/helpers/extends";
import React from 'react';
import { displayValue, styled } from "./utils.mjs";
export const Entry = styled('div', {
  fontFamily: 'Menlo, monospace',
  fontSize: '1em',
  lineHeight: '1.7',
  outline: 'none',
  wordBreak: 'break-word'
});
export const Label = styled('span', {
  color: 'white'
});
export const LabelButton = styled('button', {
  cursor: 'pointer',
  color: 'white'
});
export const ExpandButton = styled('button', {
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
  outline: 'inherit',
  background: 'transparent',
  border: 'none',
  padding: 0
});
export const Value = styled('span', (_props, theme) => ({
  color: theme.danger
}));
export const SubEntries = styled('div', {
  marginLeft: '.1em',
  paddingLeft: '1em',
  borderLeft: '2px solid rgba(0,0,0,.15)'
});
export const Info = styled('span', {
  color: 'grey',
  fontSize: '.7em'
});
export const Expander = ({
  expanded,
  style = {}
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-block',
    transition: 'all .1s ease',
    transform: "rotate(" + (expanded ? 90 : 0) + "deg) " + (style.transform || ''),
    ...style
  }
}, "\u25B6");

/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
export function chunkArray(array, size) {
  if (size < 1) return [];
  let i = 0;
  const result = [];

  while (i < array.length) {
    result.push(array.slice(i, i + size));
    i = i + size;
  }

  return result;
}
export const DefaultRenderer = ({
  HandleEntry,
  label,
  value,
  subEntries = [],
  subEntryPages = [],
  type,
  expanded = false,
  toggleExpanded,
  pageSize
}) => {
  const [expandedPages, setExpandedPages] = React.useState([]);
  return /*#__PURE__*/React.createElement(Entry, {
    key: label
  }, subEntryPages.length ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ExpandButton, {
    onClick: () => toggleExpanded()
  }, /*#__PURE__*/React.createElement(Expander, {
    expanded: expanded
  }), " ", label, ' ', /*#__PURE__*/React.createElement(Info, null, String(type).toLowerCase() === 'iterable' ? '(Iterable) ' : '', subEntries.length, " ", subEntries.length > 1 ? "items" : "item")), expanded ? subEntryPages.length === 1 ? /*#__PURE__*/React.createElement(SubEntries, null, subEntries.map(entry => /*#__PURE__*/React.createElement(HandleEntry, {
    key: entry.label,
    entry: entry
  }))) : /*#__PURE__*/React.createElement(SubEntries, null, subEntryPages.map((entries, index) => /*#__PURE__*/React.createElement("div", {
    key: index
  }, /*#__PURE__*/React.createElement(Entry, null, /*#__PURE__*/React.createElement(LabelButton, {
    onClick: () => setExpandedPages(old => old.includes(index) ? old.filter(d => d !== index) : [...old, index])
  }, /*#__PURE__*/React.createElement(Expander, {
    expanded: expanded
  }), " [", index * pageSize, " ...", ' ', index * pageSize + pageSize - 1, "]"), expandedPages.includes(index) ? /*#__PURE__*/React.createElement(SubEntries, null, entries.map(entry => /*#__PURE__*/React.createElement(HandleEntry, {
    key: entry.label,
    entry: entry
  }))) : null)))) : null) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Label, null, label, ":"), " ", /*#__PURE__*/React.createElement(Value, null, displayValue(value))));
};

function isIterable(x) {
  return Symbol.iterator in x;
}

export default function Explorer({
  value,
  defaultExpanded,
  renderer = DefaultRenderer,
  pageSize = 100,
  ...rest
}) {
  const [expanded, setExpanded] = React.useState(Boolean(defaultExpanded));
  const toggleExpanded = React.useCallback(() => setExpanded(old => !old), []);
  let type = typeof value;
  let subEntries = [];

  const makeProperty = sub => {
    const subDefaultExpanded = defaultExpanded === true ? {
      [sub.label]: true
    } : defaultExpanded == null ? void 0 : defaultExpanded[sub.label];
    return { ...sub,
      defaultExpanded: subDefaultExpanded
    };
  };

  if (Array.isArray(value)) {
    type = 'array';
    subEntries = value.map((d, i) => makeProperty({
      label: i.toString(),
      value: d
    }));
  } else if (value !== null && typeof value === 'object' && isIterable(value) && typeof value[Symbol.iterator] === 'function') {
    type = 'Iterable';
    subEntries = Array.from(value, (val, i) => makeProperty({
      label: i.toString(),
      value: val
    }));
  } else if (typeof value === 'object' && value !== null) {
    type = 'object';
    subEntries = Object.entries(value).map(([key, val]) => makeProperty({
      label: key,
      value: val
    }));
  }

  const subEntryPages = chunkArray(subEntries, pageSize);
  return renderer({
    HandleEntry: ({
      entry
    }) => /*#__PURE__*/React.createElement(Explorer, _extends({
      value: value,
      renderer: renderer
    }, rest, entry)),
    type,
    subEntries,
    subEntryPages,
    value,
    expanded,
    toggleExpanded,
    pageSize,
    ...rest
  });
}