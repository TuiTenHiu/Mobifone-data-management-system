import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import KPICards from './components/Dashboard/KPICards';
import FilterBar from './components/Dashboard/FilterBar';
import BarChartComponent from './components/Charts/BarChart';
import LineChartComponent from './components/Charts/LineChart';
import DataTable from './components/Tables/DataTable';
import Spinner from './components/Layout/Spinner';

import { FilterParams, KPIData } from './types';

/** === API CLIENT DÙNG ENV === */
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://mobifone-app.onrender.com').replace(/\/$/, '');
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});
console.log('[FE] VITE_API_URL =', API_BASE_URL);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscribers' | 'analytics' | string>('dashboard');
  const [filters, setFilters] = useState<FilterParams>({});
  const [subscriberData, setSubscriberData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  /** helper: lấy mảng thuê bao từ response (có thể là rows hoặc {data:[]}) */
  const extractSubscribers = (res: any) =>
    Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];

  // Lấy dữ liệu động từ backend
  useEffect(() => {
    setLoading(true);
    Promise.all([
      // có thể truyền limit để tránh tải quá nặng
      api.get('/api/subscribers', { params: { limit: 500 } }),
      api.get('/api/kpi'),
    ])
      .then(([subscribersRes, kpiRes]) => {
        setSubscriberData(extractSubscribers(subscribersRes));
        setKpiData(kpiRes.data);
      })
      .catch((err) => {
        console.error('[FE] fetch error:', err);
        setSubscriberData([]);
        setKpiData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return subscriberData.filter((item) => {
      if (filters.type && item.TYPE !== filters.type) return false;
      if (filters.province && filters.province !== 'Tất cả' && item.PROVINCE !== filters.province) return false;
      if (filters.district && filters.district !== 'Tất cả' && item.DISTRICT !== filters.district) return false;

      // so sánh ngày an toàn
      const itemMs = item.STA_DATE ? new Date(item.STA_DATE).getTime() : NaN;
      if (filters.startDate) {
        const startMs = new Date(filters.startDate).getTime();
        if (!isNaN(itemMs) && itemMs < startMs) return false;
      }
      if (filters.endDate) {
        const endMs = new Date(filters.endDate).getTime();
        if (!isNaN(itemMs) && itemMs > endMs) return false;
      }
      return true;
    });
  }, [filters, subscriberData]);

  // Generate chart data
  const provinceChartData = useMemo(() => {
    const provinceCount = filteredData.reduce((acc: Record<string, number>, item: any) => {
      acc[item.PROVINCE] = (acc[item.PROVINCE] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(provinceCount).map(([name, value]) => ({ name, value: Number(value) }));
  }, [filteredData]);

  const revenueChartData = useMemo(() => {
    const monthlyRevenue = filteredData.reduce((acc: Record<string, number>, item: any) => {
      const month = item.STA_DATE ? String(item.STA_DATE).substring(0, 7) : '';
      if (month) {
        acc[month] = (acc[month] || 0) + Number(item.PCK_CHARGE || 0);
      }
      return acc;
    }, {});
    return Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value: Number(value) }));
  }, [filteredData]);

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([api.get('/api/subscribers', { params: { limit: 500 } }), api.get('/api/kpi')])
      .then(([subscribersRes, kpiRes]) => {
        setSubscriberData(extractSubscribers(subscribersRes));
        setKpiData(kpiRes.data);
      })
      .catch((err) => {
        console.error('[FE] refresh error:', err);
        setSubscriberData([]);
        setKpiData(null);
      })
      .finally(() => setLoading(false));
  };

  const handleFilterReset = () => setFilters({});

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <FilterBar filters={filters} onFilterChange={setFilters} onReset={handleFilterReset} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BarChartComponent data={provinceChartData} title="Phân bố thuê bao theo tỉnh/thành phố" dataKey="value" xAxisKey="name" />
              <LineChartComponent data={revenueChartData} title="Xu hướng doanh thu theo tháng" dataKey="value" xAxisKey="name" />
            </div>
            {loading ? <Spinner /> : <DataTable data={filteredData} title={`Danh sách thuê bao (${filteredData.length} bản ghi)`} />}
          </div>
        );
      case 'subscribers':
        return (
          <div className="space-y-6">
            <FilterBar filters={filters} onFilterChange={setFilters} onReset={handleFilterReset} />
            {loading ? <div>Đang tải dữ liệu...</div> : <DataTable data={filteredData} title={`Quản lý thuê bao (${filteredData.length} bản ghi)`} />}
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BarChartComponent data={provinceChartData} title="Phân tích theo khu vực" dataKey="value" xAxisKey="name" />
              <LineChartComponent data={revenueChartData} title="Phân tích doanh thu" dataKey="value" xAxisKey="name" />
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">Tính năng "{activeTab}" đang được phát triển</h3>
            <p className="text-gray-600 mt-2">Chức năng này sẽ được cập nhật trong phiên bản tiếp theo.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onExport={handleExport} onRefresh={handleRefresh} />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
