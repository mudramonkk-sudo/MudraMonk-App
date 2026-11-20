import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Card, Chips, Disclaimer, s, Section } from '@/components/ui';
import { C, fmt } from '@/lib/theme';

type Mode = 'sip' | 'lump';

function Stepper({ label, value, onChange, step, min, max, suffix }: { label: string; value: number; onChange: (n: number) => void; step: number; min: number; max: number; suffix?: string }) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Pressable onPress={() => set(value - step)} style={btn}><Text style={btnT}>−</Text></Pressable>
        <TextInput
          style={[s.input, { flex: 1, textAlign: 'center', fontWeight: '700' }]}
          keyboardType="numeric"
          value={String(value)}
          onChangeText={(t) => set(Number(t.replace(/[^\d.]/g, '')) || 0)}
        />
        {suffix ? <Text style={{ color: C.muted, width: 44 }}>{suffix}</Text> : null}
        <Pressable onPress={() => set(value + step)} style={btn}><Text style={btnT}>+</Text></Pressable>
      </View>
    </View>
  );
}
const btn = { width: 42, height: 42, borderRadius: 11, backgroundColor: C.sky, alignItems: 'center' as const, justifyContent: 'center' as const };
const btnT = { color: C.blue, fontSize: 20, fontWeight: '700' as const };

export default function Sip() {
  const [mode, setMode] = useState<Mode>('sip');
  const [amt, setAmt] = useState(5000);
  const [lump, setLump] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const rows = useMemo(() => {
    const r = rate / 100;
    const out: { inv: number; val: number }[] = [];
    for (let y = 1; y <= years; y++) {
      if (mode === 'sip') {
        const i = r / 12, n = y * 12;
        out.push({ inv: amt * n, val: i ? amt * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : amt * n });
      } else out.push({ inv: lump, val: lump * Math.pow(1 + r, y) });
    }
    return out;
  }, [mode, amt, lump, rate, years]);

  const last = rows[rows.length - 1] ?? { inv: 0, val: 0 };
  const max = Math.max(1, last.val);
  const W = 320, H = 140, bw = W / Math.max(1, rows.length);

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <Section title="SIP & Lumpsum Calculator">
        <Chips<Mode> items={[{ key: 'sip', label: 'SIP (monthly)' }, { key: 'lump', label: 'Lumpsum (one-time)' }]} value={mode} onChange={setMode} />
        <Card>
          {mode === 'sip'
            ? <Stepper label="Monthly investment (₹)" value={amt} onChange={setAmt} step={500} min={100} max={10000000} />
            : <Stepper label="One-time investment (₹)" value={lump} onChange={setLump} step={10000} min={500} max={1000000000} />}
          <Stepper label="Expected return (per year)" value={rate} onChange={setRate} step={0.5} min={1} max={30} suffix="%" />
          <Stepper label="Time period" value={years} onChange={setYears} step={1} min={1} max={40} suffix="years" />
        </Card>

        <Card style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[['Invested', last.inv], ['Est. returns', last.val - last.inv], ['Total value', last.val]].map(([k, v]) => (
              <View key={k as string} style={{ flexGrow: 1, minWidth: '30%', backgroundColor: C.bg, borderRadius: 11, padding: 10 }}>
                <Text style={{ fontSize: 11, color: C.muted }}>{k as string}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: k === 'Total value' ? C.blue : C.navy }}>₹{fmt(v as number, 0)}</Text>
              </View>
            ))}
          </View>
          <Svg width="100%" height={H + 6} viewBox={`0 0 ${W} ${H + 6}`} style={{ marginTop: 12 }}>
            {rows.map((r, i) => (
              <React.Fragment key={i}>
                <Rect x={i * bw + bw * 0.15} y={H - (r.val / max) * H} width={bw * 0.7} height={(r.val / max) * H} rx={2} fill={C.blue} />
                <Rect x={i * bw + bw * 0.15} y={H - (r.inv / max) * H} width={bw * 0.7} height={(r.inv / max) * H} rx={2} fill="#9FC0FF" />
              </React.Fragment>
            ))}
          </Svg>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
            <Text style={s.note}><Text style={{ color: '#9FC0FF' }}>■</Text> Invested</Text>
            <Text style={s.note}><Text style={{ color: C.blue }}>■</Text> Estimated value</Text>
          </View>
          <Text style={[s.note, { marginTop: 8 }]}>Illustration only. Actual returns vary and are not guaranteed. Mutual fund investments are subject to market risks.</Text>
        </Card>
      </Section>
      <Disclaimer />
    </ScrollView>
  );
}
