// Inline SVG icons. Each takes size + color via props (color defaults to
// currentColor so they inherit text color). Stroke-based, 24x24 viewBox.

const S = ({ size = 22, children, fill = 'none', stroke = 'currentColor', sw = 2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const Home = (p) => (
  <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></S>
)
export const Cards = (p) => (
  <S {...p}><rect x="3" y="7" width="14" height="13" rx="2.2" /><path d="M7 4h10a2 2 0 0 1 2 2v9" /></S>
)
export const Quiz = (p) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M9.3 9.2a2.8 2.8 0 0 1 5.2 1.3c0 1.8-2.6 2.2-2.6 4" /><circle cx="11.9" cy="17" r=".6" fill="currentColor" stroke="none" /></S>
)
export const Formula = ({ size = 22, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
    <text x="12" y="18" textAnchor="middle" fontSize="20" fontStyle="italic" fontFamily="'Public Sans',serif" fontWeight="600" fill={color}>ƒ</text>
  </svg>
)
export const Search = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></S>
)
export const Flame = ({ size = 16, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} aria-hidden="true">
    <path d="M12 2c.6 3-1.8 4.3-1.8 6.6 0 1 .7 1.8 1.6 1.8.6 0 1-.3 1.3-.8.7 1 .9 2 .9 2.9 0 .9-.4 1.7-1 2.3 2.4-.4 4-2.5 4-5.1C17 6.6 14.5 4 12 2Z" opacity=".55" />
    <path d="M12 22c-3.3 0-6-2.5-6-5.8 0-2.6 1.7-4.3 3-6 .2 1.2 1 2 2 2.4-.2-2.6 1.4-4.3 1.6-6.6 1.5 1.3 5.4 4 5.4 8.6C18 19.2 15.3 22 12 22Z" />
  </svg>
)
export const Clock = (p) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>
)
export const Check = (p) => (<S {...p}><path d="m5 12.5 4.5 4.5L19 7" /></S>)
export const Cross = (p) => (<S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>)
export const Chevron = (p) => (<S {...p}><path d="m6 9 6 6 6-6" /></S>)
export const ArrowR = (p) => (<S {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></S>)
export const ArrowL = (p) => (<S {...p}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></S>)
export const Shuffle = (p) => (
  <S {...p}><path d="M16 4h4v4" /><path d="M20 4 4 20" /><path d="M4 4l5 5" /><path d="m15 15 5 5" /><path d="M16 20h4v-4" /></S>
)
export const Mail = (p) => (
  <S {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></S>
)
export const Logout = (p) => (
  <S {...p}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></S>
)
