'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';

interface DataPoint {
  [key: string]: string | number;
}

interface AreaChartProps {
  title?: string;
  data: DataPoint[];
  xKey: string;
  areaKey: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  height?: number;
  showGrid?: boolean;
}

export function AreaChart({
  title,
  data,
  xKey,
  areaKey,
  color = '#6366f1',
  gradientFrom = '#6366f1',
  gradientTo = 'transparent',
  height = 300,
  showGrid = true,
}: AreaChartProps) {
  const gradientId = `gradient-${areaKey}`;

  return (
    <Card>
      {title && <h3 className="text-lg font-semibold text-text mb-4">{title}</h3>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#252136',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              itemStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey={areaKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
