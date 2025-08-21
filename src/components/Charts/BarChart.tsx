import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '../../types';

interface BarChartComponentProps {
  data: ChartData[];
  title: string;
  dataKey: string;
  xAxisKey: string;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  title, 
  dataKey = 'value',
  xAxisKey = 'name'
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString('vi-VN'), 'Số lượng']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              name="Thuê bao"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;