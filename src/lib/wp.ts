import { WP_API } from './config';

export type Post = {
  id: number;
  date: string;
  link: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  categories: number[];
};

type RawPost = {
  id: number; date: string; link: string; categories: number[];
  title: { rendered: string }; excerpt: { rendered: string }; content?: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string; media_details?: { sizes?: Record<string, { source_url: string }> } }[] };
};

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', rupee: '₹' };
export function decode(s: string) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function map(p: RawPost): Post {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const sizes = media?.media_details?.sizes;
  return {
    id: p.id, date: p.date, link: p.link, categories: p.categories,
    title: decode(p.title.rendered),
    excerpt: decode(p.excerpt.rendered),
    content: p.content?.rendered ?? '',
    image: sizes?.medium_large?.source_url ?? sizes?.medium?.source_url ?? media?.source_url,
  };
}

export async function getPosts(opts: { category?: number; page?: number; perPage?: number; search?: string } = {}) {
  const q = new URLSearchParams({
    per_page: String(opts.perPage ?? 10),
    page: String(opts.page ?? 1),
    _embed: 'wp:featuredmedia',
    _fields: 'id,date,link,title,excerpt,categories,_links,_embedded',
  });
  if (opts.category) q.set('categories', String(opts.category));
  if (opts.search) q.set('search', opts.search);
  const res = await fetch(`${WP_API}/posts?${q}`);
  if (res.status === 400) return { posts: [] as Post[], totalPages: 0 }; // page past the end
  if (!res.ok) throw new Error(`Could not load posts (HTTP ${res.status})`);
  const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? 1);
  return { posts: ((await res.json()) as RawPost[]).map(map), totalPages };
}

export async function getPost(id: number) {
  const res = await fetch(`${WP_API}/posts/${id}?_embed=wp:featuredmedia`);
  if (!res.ok) throw new Error(`Could not load post (HTTP ${res.status})`);
  return map((await res.json()) as RawPost);
}

export const niceDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
