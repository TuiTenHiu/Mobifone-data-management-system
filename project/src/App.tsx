// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';

import Sidebar from './components/Layout/Sidebar';
import Header, { ExportFormat } from './components/Layout/Header';
import KPICards from './components/Dashboard/KPICards';
import FilterBar from './components/Dashboard/FilterBar';
import BarChartComponent from './components/Charts/BarChart';
import LineChartComponent from './components/Charts/LineChart';
import DataTable from './components/Tables/DataTable';
import Spinner from './components/Layout/Spinner';

import api from './axios';
import { FilterParams, KPIData } from './types';

// Kiểu dữ liệu thuê bao (coi như any nếu bạn chưa có types đầy đủ)
type SubscriberRow = any;

type TabKey = 'dashboard' | 'subscribers' | 'analytics' | string;

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Bộ lọc hiện tại
  const [filters, setFilters] = useState<FilterParams>({});

  // Dữ liệu thuê bao (đã lọc + phân trang từ server)
  const [subscriberData, setSubscriberData] = useState<SubscriberRow[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);

  // Trạng thái tải & phân trang
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100); // có thể cho người dùng chọn 50/100/200...
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // ---- Helpers --------------------------------------------------------------
  const sanitizeFilters = (f: FilterParams) => {
    // Chuyển 'Tất cả' -> undefined để server không filter
    const norm = (v?: string) => (v && v !== 'Tất cả' ? v : undefined);
    return {
      type: norm(f.type),
      province: norm(f.province),
      district: norm(f.district),
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
    };
  };

  const fetchKPI = async () => {
    const res = await api.get('/api/kpi');
    return res.data as KPIData;
  };

  const fetchSubscribers = async ({
    page,
    limit,
    filters,
  }: {
    page: number;
    limit: number;
    filters: FilterParams;
  }) => {
    const params = {
      page,
      limit,
      ...sanitizeFilters(filters),
    };

    const res = await api.get('/api/subscribers', { params });

    // Server recommended payload:
    // { total, page, limit, hasMore, data: [...] }
    const payload = res.data;
    const rows: SubscriberRow[] = Array.isArray(payload)
      ? payload
      : payload?.data ?? [];

    return {
      rows,
      total: payload?.total ?? rows.length,
      hasMore: payload?.hasMore ?? false,
    };
  };

  const firstItemIndex = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [page, limit, total]
  );
  const lastItemIndex = useMemo(
    () => Math.min(page * limit, total),
    [page, limit, total]
  );

  // ---- Side effects: tải KPI + thuê bao ------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // “Đánh thức” backend free nếu cần
        await api.get('/api/readyz').catch(() => {});

        const [kpi, subs] = await Promise.all([
          fetchKPI(),
          fetchSubscribers({ page, limit, filters }),
        ]);

        setKpiData(kpi);
        setSubscriberData(subs.rows);
        setTotal(subs.total);
        setHasMore(subs.hasMore);
      } catch (err) {
        console.error('[FE] load error:', err);
        setSubscriberData([]);
        setTotal(0);
        setHasMore(false);
        setKpiData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit, filters]);

  // Khi đổi filter thì quay về page 1
  const onFilterChange = (next: FilterParams) => {
    setFilters(next);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleRefresh = async () => {
    // chỉ cần kích hoạt lại useEffect
    setPage((p) => p); // trick nhỏ để trigger nhưng thường không cần
  };

  // ---- Export helpers -------------------------------------------------------
  const exportToCSV = (rows: any[], filename = 'subscribers.csv') => {
    if (!rows?.length) return;
    const cols = Object.keys(rows[0]);
    const header = cols.join(',');
    const body = rows
      .map((r) =>
        cols
          .map((c) => {
            const raw = r[c] ?? '';
            const cell = String(raw).replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) return `"${cell}"`;
            return cell;
          })
          .join(',')
      )
      .join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async (rows: any[], filename = 'subscribers.xlsx') => {
    if (!rows?.length) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = async (rows: any[], filename = 'subscribers.pdf') => {
    if (!rows?.length) return;
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape' });

    const cols = [
      'SUB_ID',
      'TYPE',
      'STA_TYPE',
      'SUB_TYPE',
      'STA_DATE',
      'END_DATE',
      'PROVINCE',
      'DISTRICT',
      'PCK_CODE',
      'PCK_DATE',
      'PCK_CHARGE',
    ].filter((c) => c in rows[0]);

    const tableRows = rows.map((r) => cols.map((c) => r[c] ?? ''));

    // @ts-expect-error (plugin adds autoTable to jsPDF instance)
    doc.autoTable({
      head: [cols],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
      startY: 14,
      theme: 'grid',
    });

    doc.text('Báo cáo thuê bao', 14, 10);
    doc.save(filename);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      if (!subscriberData.length) return;
      if (format === 'csv') return exportToCSV(subscriberData);
      if (format === 'excel') return exportToExcel(subscriberData);
      if (format === 'pdf') return exportToPDF(subscriberData);
    } catch (e) {
      console.error('[Export] Lỗi xuất file:', e);
      alert(
        'Không thể xuất file. Hãy đảm bảo đã cài đặt "xlsx", "jspdf" và "jspdf-autotable" nếu bạn chọn Excel/PDF.'
      );
    }
  };

  // ---- Dữ liệu biểu đồ -----------------------------------------------------
  const provinceChartData = useMemo(() => {
    const count: Record<string, number> = {};
    for (const r of subscriberData) {
      const key = r.PROVINCE || 'N/A';
      count[key] = (count[key] || 0) + 1;
    }
    return Object.entries(count).map(([name, value]) => ({
      name,
      value: Number(value),
    }));
  }, [subscriberData]);

  const revenueChartData = useMemo(() => {
    const monthSum: Record<string, number> = {};
    for (const r of subscriberData) {
      const month = r.STA_DATE ? String(r.STA_DATE).substring(0, 7) : '';
      if (!month) continue;
      monthSum[month] = (monthSum[month] || 0) + Number(r.PCK_CHARGE || 0);
    }
    return Object.entries(monthSum)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value: Number(value) }));
  }, [subscriberData]);

  // ---- Render pages ---------------------------------------------------------
  const TableWithPagination = (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <DataTable
            data={subscriberData}
            title={`Danh sách thuê bao (${firstItemIndex}-${lastItemIndex}/${total})`}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Hiển thị <b>{firstItemIndex}</b>–<b>{lastItemIndex}</b> /{' '}
              <b>{total}</b>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Trang trước
              </button>
              <span className="text-sm text-gray-700">Trang {page}</span>
              <button
                className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || loading}
              >
                Trang sau
              </button>
              <select
                className="ml-2 border rounded px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[50, 100, 200, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}/trang
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <KPICards data={kpiData} />
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={handleFilterReset}
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
            {TableWithPagination}
          </div>
        );

      case 'subscribers':
        return (
          <div className="space-y-6">
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={handleFilterReset}
            />
            {TableWithPagination}
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
          onRefresh={handleRefresh}                                                                                                                                                                               
          onExport={handleExport}
          exportDisabled={!subscriberData.length}
        />
        <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;