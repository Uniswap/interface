// TODO: properly componentize <Input /> and incorporate these styles (or better ones)
export const inputStyles = {
  noOutline: { outlineWidth: 0 },
  inputFocus: {
    backgroundColor: '$surface2',
    borderWidth: 1,
    borderColor: '$neutral3',
    outlineWidth: 0,
  },
  inputHover: { borderWidth: 1, borderColor: '$surface3', outlineWidth: 0 },
} as const
