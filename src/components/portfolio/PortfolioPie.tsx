'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PortfolioHolding } from '@/types';

const COLORS = ['#00FF88', '#00D4FF', '#FF6B6B', '#FFD93D', '#6C5CE7', '#FD79A8', '#00B894', '#E17055'];

interface PortfolioPieProps {
  holdings: PortfolioHolding[];
}

export default function PortfolioPie({ holdings }: PortfolioPieProps) {
  const data = holdings.map((h) => ({
    name: h.coin_symbol,
    value: h.current_value || h.amount * h.buy_price,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8888AA] text-sm">
        No holdings to display
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121A] p-4">
      <h3 className="text-sm font-medium text-white mb-4">Portfolio Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-[#8888AA]">
              {item.name} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
