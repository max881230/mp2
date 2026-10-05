type IconName =
  | 'arrow'
  | 'left'
  | 'right'
  | 'grid'
  | 'list'
  | 'search'
  | 'close'
  | 'external'
  | 'art'
const paths: Record<IconName, string> = {
  arrow: 'M4 12h16M14 6l6 6-6 6',
  left: 'M20 12H4m6-6-6 6 6 6',
  right: 'M4 12h16m-6-6 6 6-6 6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  close: 'M6 6l12 12M6 18 18 6',
  external: 'M8 4H4v16h16v-4M12 3h9v9M21 3 10 14',
  art: 'M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01',
}
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
