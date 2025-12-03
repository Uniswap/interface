// Standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
export const zIndexes = {
  negative: -1,
  background: 0,
  default: 1,
  mask: 10,
  dropdown: 970,
  header: 980,
  sidebar: 990,
  // Note: tamagui dialog portal defaults to 1000. any z-index >= 1000 will appear above this portal
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popoverBackdrop: 1065,
  popover: 1070,
  tooltip: 1080,
  // Custom value needed to properly display components
  // above modals (e.g. in the extension app)
  overlay: 100010,
}
