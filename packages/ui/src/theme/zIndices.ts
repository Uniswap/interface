// Standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
export const zIndices = {
  negative: -1,
  background: 0,
  default: 1,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  // Custom value needed to properly display components
  // above modals (e.g. in the extension app)
  overlay: 100001,
}
