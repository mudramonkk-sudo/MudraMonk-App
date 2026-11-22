import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { getHistory, Index } from '@/lib/market';
import { C, fmt, pct } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

type Range = '1D' | '1W' | '1M' | '1Y';
const DAYS: Record<Exclude<Range, '1D'>, number> = { '1W': 7, '1M': 31, '1Y': 366 };

/** Bottom sheet with Nifty / Sensex / Bank Nifty chart (data from history.json). */
export function IndexChart({ index, updated, onClose }: { index: Index | null; updated?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('1D');
  const [w, setW] = useState(320);
  const { data, loading } = useAsync((f) => getHistory(f));
  const hist = index ? data?.indices[index.n] : undefined;

  const series = useMemo(() => {
    if (!hist || !index) return { pts: [] as number[], labels: [] as string[], base: undefined as number | undefined };
    if (range === '1D') {
      const d = hist.d1 ?? [];
      const prevClose = hist.daily?.filter((x) => x[0] < (hist.d1_date ?? '9999'))?.at(-1)?.[1];
      return { pts: d.map((x) => x[1]), labels: d.length ? [d[0][0], d[Math.floor(d.length / 2)][0], d[d.length - 1][0]] : [], base: prevClose };
    }
    const cut = new Date(Date.now() - DAYS[range] * 864e5).toISOString().slice(0, 10);
    const d = (hist.daily ?? []).filter((x) => x[0] >= cut);
    const lab = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return { pts: d.map((x) => x[1]), labels: d.length ? [lab(d[0][0]), lab(d[Math.floor(d.length / 2)][0]), lab(d[d.length - 1][0])] : [], base: d[0]?.[1] };
  }, [hist, index, range]);

  const H = 170;
  const { pts, base } = series;
  const chart = useMemo(() => {
    if (pts.length < 2) return null;
    const lo = Math.min(...pts, base ?? Infinity), hi = Math.max(...pts, base ?? -Infinity);
    const X = (i: number) => (i / (pts.length - 1)) * w;
    const Y = (v: number) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (H - 16);
    const line = pts.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    return { line, area: `${line} L${w},${H} L0,${H} Z`, Y, last: Y(pts[pts.length - 1]) };
  }, [pts, base, w]);

  if (!index) return null;
  const rangeChange = range === '1D' ? index.ch : pts.length ? pts[pts.length - 1] - pts[0] : 0;
  const rangePct = range === '1D' ? index.pct : pts.length && pts[0] ? (rangeChange / pts[0]) * 100 : 0;
  const col = rangeChange >= 0 ? C.up : C.down;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.scrim} onPress={onClose} />
      <View style={[st.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={st.grab} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={st.name}>{index.n}</Text>
            <Text style={st.big}>{fmt(index.p)}</Text>
            <Text style={{ color: col, fontSize: 12.5, fontWeight: '500', marginTop: 2 }}>
              {rangeChange >= 0 ? '▲' : '▼'} {rangeChange >= 0 ? '+' : ''}{fmt(rangeChange)} ({pct(rangePct)}) {range === '1D' ? 'today' : range}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={st.close}><Text style={{ color: C.muted, fontSize: 15 }}>✕</Text></Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, marginBottom: 8 }}>
          {(['1D', '1W', '1M', '1Y'] as Range[]).map((r) => (
            <Pressable key={r} onPress={() => setRange(r)} style={[st.rng, range === r && st.rngOn]}>
              <Text style={[st.rngT, range === r && { color: C.blue, fontWeight: '600' }]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {loading ? <Text style={st.fine}>Loading chart…</Text> : chart ? (
            <Svg width={w} height={H}>
              <Defs>
                <LinearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={col} stopOpacity={0.18} />
                  <Stop offset="1" stopColor={col} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {base !== undefined ? <Line x1={0} x2={w} y1={chart.Y(base)} y2={chart.Y(base)} stroke="#C7D0DE" strokeDasharray="3 4" /> : null}
              <Path d={chart.area} fill="url(#ga)" />
              <Path d={chart.line} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" />
              <Circle cx={w} cy={chart.last} r={3.5} fill={col} />
            </Svg>
          ) : <Text style={st.fine}>Chart data not available yet.</Text>}
        </View>
        {series.labels.length ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            {series.labels.map((l, i) => <Text key={i} style={{ fontSize: 10, color: C.muted }}>{l}</Text>)}
          </View>
        ) : null}

        <Text style={st.fine}>
          Data delayed · Updated {updated ?? data?.updated ?? ''}{range === '1D' && hist?.d1_date ? ` · ${new Date(hist.d1_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} session` : ''}
        </Text>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(19,37,74,0.25)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 16, paddingTop: 10 },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 12 },
  name: { fontSize: 14, color: C.muted, fontWeight: '500' },
  big: { fontSize: 24, fontWeight: '600', color: C.navy, marginTop: 2 },
  close: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  rng: { borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  rngOn: { backgroundColor: C.sky, borderColor: C.sky },
  rngT: { fontSize: 11.5, color: C.muted },
  fine: { fontSize: 10.5, color: '#9AA5B8', marginTop: 10 },
});
