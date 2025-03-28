import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  TooltipProps
} from 'recharts';
import {
  ValueType,
  NameType
} from 'recharts/types/component/DefaultTooltipContent';

export interface TrafficDataPoint {
  time: string;
  blocked: number;
  allowed: number;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
}

interface TrafficChartProps {
  data: TrafficDataPoint[];
  height?: number;
}

interface DistributionChartProps {
  data: DistributionDataPoint[];
  height?: number;
}

// Custom tooltip formatter for the traffic chart
const TrafficTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    // Just use the label directly as it's already formatted
    const time = label;
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-md">
        <p className="text-xs text-slate-500 mb-1">{time}</p>
        <p className="text-sm font-medium text-success">
          Allowed: {payload[0].value}
        </p>
        <p className="text-sm font-medium text-primary">
          Blocked: {payload[1].value}
        </p>
      </div>
    );
  }

  return null;
};

// Custom tooltip formatter for the distribution chart
const DistributionTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length && payload[0]?.value !== undefined) {
    // Get the value in a type-safe way
    const value = payload[0].value;
    const formattedValue = typeof value === 'number' 
      ? `${value.toFixed(1)}%` 
      : `${value}%`;
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-md">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-primary">{formattedValue}</p>
      </div>
    );
  }

  return null;
};

export const TrafficChart: React.FC<TrafficChartProps> = ({ data, height = 300 }) => {
  // Format the time to show only hour
  const formattedData = data.map(item => {
    // Check if the time is already in the format HH:00 (like "8:00")
    // If so, just return it as is, otherwise try to parse it as a date
    if (item.time && item.time.match(/^\d+:00$/)) {
      return {
        ...item,
        // Just keep the same time format
        time: item.time
      };
    } else {
      try {
        // Try to parse as a date if it's not in the expected format
        return {
          ...item,
          time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit' })
        };
      } catch (error) {
        // If parsing fails, just return the hour number with ":00"
        return {
          ...item,
          time: item.time || "0:00"
        };
      }
    }
  });
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={formattedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="time" 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<TrafficTooltip />} />
        <Area 
          type="monotone" 
          dataKey="allowed" 
          stackId="1"
          stroke="#16a34a" 
          fill="#16a34a" 
          fillOpacity={0.6}
        />
        <Area 
          type="monotone" 
          dataKey="blocked" 
          stackId="2"
          stroke="#1E40AF" 
          fill="#1E40AF" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const DistributionChart: React.FC<DistributionChartProps> = ({ data, height = 300 }) => {
  // Colors for different attack types
  const getBarColor = (index: number) => {
    const colors = ['#1E40AF', '#EA580C', '#0F766E', '#CA8A04', '#94A3B8'];
    return colors[index % colors.length];
  };
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip content={<DistributionTooltip />} />
        {data.map((entry, index) => (
          <Bar 
            key={`bar-${index}`}
            dataKey="value" 
            fill={getBarColor(index)} 
            barSize={16}
            radius={[0, 4, 4, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
