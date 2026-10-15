import { studioIconPaths } from '../lib/studioIcons'

export default function StudioIcon({ name = 'arrow', size = 14 }: { name?: keyof typeof studioIconPaths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={studioIconPaths[name]} /></svg>
}
