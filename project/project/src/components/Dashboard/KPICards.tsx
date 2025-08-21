import React from 'react';
import { Users, UserCheck, DollarSign, TrendingUp } from 'lucide-react';
import { KPIData } from '../../types';

interface KPICardsProps {
  data: KPIData | null;
}

const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Loading state
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng thuê bao',
      value: data.totalSubscribers.toLocaleString('vi-VN'),
      icon: Users,
      color: 'bg-blue-500',
      change: `${data.growthRate >= 0 ? '+' : ''}${data.growthRate}%`,
      changeType: data.growthRate >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Thuê bao hoạt động',
      value: data.activeSubscribers.toLocaleString('vi-VN'),
      icon: UserCheck,
      color: 'bg-green-500',
      change: `${Math.round((data.activeSubscribers / data.totalSubscribers) * 100)}%`,
      changeType: 'neutral'
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      color: 'bg-purple-500',
      change: `${formatCurrency(data.totalRevenue / data.totalSubscribers)}/TB`,
      changeType: 'neutral'
    },
    {
      title: 'Tăng trưởng',
      value: `${data.growthRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+2.5%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{card.value}</p>
                <div className="flex items-center">
                  <span className={`
                    text-sm font-medium
                    ${card.changeType === 'increase' ? 'text-green-600' : 
                      card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'}
                  `}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">so với tháng trước</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;