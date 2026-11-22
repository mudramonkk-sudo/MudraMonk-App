import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_URL, PRICES_URL, STOCKS_URL } from './config';

export type Index = { n: string; p: number; ch: number; pct: number };
/** [name, symbol, price, pctChange, volumeText] */
export type Mover = [string, string, number, number, string];
export type Prices = { updated: string; items: Index[]; g: Mover[]; l: Mover[]; v: Mover[] };

export type Stock = {
  name: string; symbol: string; price: number; change: number; pct: number;
  open: number; high: number; low: number; volume: number;
};
export type StockList = { updated: string; stocks: Stock[] };

const TTL = 5 * 60 * 1000; // re-download at most every 5 min
const mem: Record<string, { at: number; data: unknown }> = {};

async function getJson<T>(url: string, force = false): Promise<T> {
  const hit = mem[url];
  if (!force && hit && Date.now() - hit.at < TTL) return hit.data as T;
  try {
    // cache-buster so GitHub's CDN gives the latest commit
    const res = await fetch(`${url}?t=${Math.floor(Date.now() / 60000)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    mem[url] = { at: Date.now(), data };
    AsyncStorage.setItem(`cache:${url}`, JSON.stringify(data)).catch(() => {});
    return data;
  } catch (e) {
    // offline: fall back to last saved copy
    const saved = await AsyncStorage.getItem(`cache:${url}`).catch(() => null);
    if (saved) return JSON.parse(saved) as T;
    throw e;
  }
}

export const getPrices = (force = false) => getJson<Prices>(PRICES_URL, force);

export async function getStocks(force = false): Promise<StockList> {
  const raw = await getJson<{ updated: string; s: (string | number)[][] }>(STOCKS_URL, force);
  return {
    updated: raw.updated,
    stocks: raw.s.map((r) => ({
      name: String(r[0]), symbol: String(r[1]), price: Number(r[2]), change: Number(r[3]),
      pct: Number(r[4]), open: Number(r[5]), high: Number(r[6]), low: Number(r[7]), volume: Number(r[8]),
    })),
  };
}

export function searchStocks(list: Stock[], q: string, limit = 40) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const starts: Stock[] = [];
  const has: Stock[] = [];
  for (const x of list) {
    const sym = x.symbol.toLowerCase();
    const nm = x.name.toLowerCase();
    if (sym.startsWith(s) || nm.startsWith(s)) starts.push(x);
    else if (sym.includes(s) || nm.includes(s)) has.push(x);
    if (starts.length >= limit) break;
  }
  return [...starts, ...has].slice(0, limit);
}

/** Index chart data: d1 = [["09:15", close], …] for the latest trading day; daily = [["2026-11-20", close], …] */
export type IndexHistory = { d1?: [string, number][]; d1_date?: string; daily?: [string, number][] };
export type History = { updated: string; indices: Record<string, IndexHistory> };
export const getHistory = (force = false) => getJson<History>(HISTORY_URL, force);
