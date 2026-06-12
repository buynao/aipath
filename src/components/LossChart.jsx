import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// ============================================================
// Recharts 损失下降曲线 —— 图表库示范组件
// data: [{ step: number, loss: number }, ...]
// 颜色走设计 token（var(--xxx)），自动跟随深浅色主题
// ============================================================
export default function LossChart({ data, height = 150 }) {
  return (
    <div style={{ width: '100%', height, marginTop: 10 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -28 }}>
          <CartesianGrid stroke="var(--hairline)" vertical={false} />
          <XAxis
            dataKey="step"
            tick={{ fontSize: 10, fill: 'var(--fg-2)' }}
            stroke="var(--hairline-strong)"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--fg-2)' }}
            stroke="var(--hairline-strong)"
            tickLine={false}
            width={48}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-lift)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--fg-0)',
            }}
            labelFormatter={(v) => `第 ${v} 步`}
            formatter={(v) => [Number(v).toFixed(3), '损失']}
          />
          <Line
            type="monotone"
            dataKey="loss"
            stroke="var(--sky)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
