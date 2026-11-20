import { SitePage } from '@/components/Web';
import { PAGES } from '@/lib/config';

/** The website's IPO page (kept up to date by the existing 9:00 / 19:00 updates). */
export default function Ipo() {
  return <SitePage path={PAGES.ipo} />;
}
