// src/App.tsx
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import KPICards from './components/Dashboard/KPICards';
import FilterBar from './components/Dashboard/FilterBar';
import BarChartComponent from './components/Charts/BarChart';
import LineChartComponent from './components/Charts/LineChart';
import DataTable from './components/Tables/DataTable';
import Spinner from './components/Layout/Spinner';

import { FilterParams, KPIData } from './types';
import api from './axios';

type TabKey = 'dashboard' | 'subscribers' | 'analytics' | string;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // filters FE
  const [filters, setFilters] = useState<FilterParams>({});

  // phân trang server
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100); // page size mặc định
  const [total, setTotal] = useState<number>(0);

  // data
  const [subscriberData, setSubscriberData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  /** Chuẩn hoá filter để truyền lên API (bỏ 'Tất cả', định dạng ngày) */
  const normFilters = (f: FilterParams) => {
    const norm = (v?: string) => (v && v !== 'Tất cả' ? v : undefined);
    const toDate = (v?: string) =>
      v ? new Date(v).toISOString().slice(0, 10) : undefined;

    return {
      type: norm(f.type),
      province: norm(f.province),
      district: norm(f.district),
      startDate: toDate(f.startDate),
      endDate: toDate(f.endDate),
    };
  };

  /** Bóc dữ liệu + tổng từ nhiều kiểu payload thường gặp */
  const parseSubRes = (res: any) => {
    const payload = res?.data ?? res;
    const data =
      Array.isArray(payload) ? payload :
      payload?.data ?? payload?.rows ?? [];
    const total =
      payload?.total ?? payload?.count ?? payload?.meta?.total ?? data.length;
    return { data, total };
  };

  /** Tải KPI (toàn cục) */
  const fetchKPI = async () => {
    try {
      const kpiRes = await api.get('/api/kpi');
      setKpiData(kpiRes.data);
    } catch {
      setKpiData(null);
    }
  };

  /** Tải danh sách thuê bao theo filter + phân trang */
  const fetchSubscribers = async (f: FilterParams, p: number, l: number) => {
    const params = { ...normFilters(f), page: p, limit: l };
    const res = await api.get('/api/subscribers', { params });
    return parseSubRes(res);
  };

  /** Lần đầu: “đánh thức” backend free, tải KPI & trang đầu */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await api.get('/api/readyz').catch(() => {}); // wake up
        await fetchKPI();
        const { data, total } = await fetchSubscribers(filters, page, limit);
        if (!alive) return;
        setSubscriberData(data);
        setTotal(total);
      } catch (e) {
        if (!alive) return;
        setSubscriberData([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mỗi khi filter/page/limit đổi → tải lại danh sách */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data, total } = await fetchSubscribers(filters, page, limit);
        if (!alive) return;
        setSubscriberData(data);
        setTotal(total);
      } catch {
        if (!alive) return;
        setSubscriberData([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [filters, page, limit]);

  /** Khi đổi filter từ FilterBar → reset về trang 1 */
  const onFilterChange = (next: FilterParams) => {
    setFilters(next);
    setPage(1);
  };

  /** Làm mới cả KPI và trang hiện tại */
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await api.get('/api/readyz').catch(() => {});
      await fetchKPI();
      const { data, total } = await fetchSubscribers(filters, page, limit);
      setSubscriberData(data);
      setTotal(total);
    } catch {
      setSubscriberData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /** Export (tuỳ bạn triển khai thêm) */
  const handleExport = () => {
    console.log('Exporting…', { filters, page, limit, total });
  };

  /** Tính dữ liệu biểu đồ từ trang hiện tại */
  const provinceChartData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of subscriberData) {
      const k = it.PROVINCE ?? 'N/A';
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [subscriberData]);

  const revenueChartData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of subscriberData) {
      const month = it.STA_DATE ? String(it.STA_DATE).slice(0, 7) : '';
      if (!month) continue;
      m[month] = (m[month] || 0) + Number(it.PCK_CHARGE || 0);
    }
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [subscriberData]);

  /** Pager helpers */
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const renderContent = () => {
    const contentTable = (
      <>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <DataTable
              data={subscriberData}
              title={`Danh sách thuê bao — trang ${page}/${totalPages} (${total.toLocaleString()} bản ghi)`}
            />
            {/* Pager đơn giản */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Tổng: <b>{total.toLocaleString()}</b> • Trang: <b>{page}</b> / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Page size:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={limit}
                  onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                >
                  {[50, 100, 200, 500, 1000].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!canPrev}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 rounded border disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={!canNext}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={() => { setFilters({}); setPage(1); }}
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BarChartComponent
                data={provinceChartData}
                title="Phân bố thuê bao theo tỉnh/thành phố"
                dataKey="value"
                xAxisKey="name"
              />
              <LineChartComponent
                data={revenueChartData}
                title="Xu hướng doanh thu theo tháng"
                dataKey="value"
                xAxisKey="name"
              />
            </div>
            {contentTable}
          </div>
        );

      case 'subscribers':
        return (
          <div className="space-y-6">
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={() => { setFilters({}); setPage(1); }}
            />
            {contentTable}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BarChartComponent
                data={provinceChartData}
                title="Phân tích theo khu vực"
                dataKey="value"
                xAxisKey="name"
              />
              <LineChartComponent
                data={revenueChartData}
                title="Phân tích doanh thu"
                dataKey="value"
                xAxisKey="name"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Tính năng "{activeTab}" đang được phát triển
            </h3>
            <p className="text-gray-600 mt-2">
              Chức năng này sẽ được cập nhật trong phiên bản tiếp theo.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;