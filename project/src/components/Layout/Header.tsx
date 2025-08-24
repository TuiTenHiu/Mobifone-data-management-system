// src/components/Layout/Header.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileDown,
} from 'lucide-react';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

interface HeaderProps {
  onMenuToggle: () => void;
  onExport: (format: ExportFormat) => void; // ✅ truyền định dạng
  onRefresh: () => void;
  exportDisabled?: boolean;                 // tùy chọn: disable export khi không có dữ liệu
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  onExport,
  onRefresh,
  exportDisabled = false,
}) => {
  const [openExport, setOpenExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setOpenExport(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const chooseExport = (fmt: ExportFormat) => {
    onExport(fmt);
    setOpenExport(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-semibold text-gray-900">
            Bảng điều khiển thuê bao
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Làm mới dữ liệu"
            aria-label="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => !exportDisabled && setOpenExport((v) => !v)}
              disabled={exportDisabled}
              className={`p-2 rounded-lg flex items-center gap-1 ${
                exportDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Xuất báo cáo"
              aria-haspopup="menu"
              aria-expanded={openExport}
            >
              <Download className="w-5 h-5" />
              <ChevronDown className="w-4 h-4" />
            </button>

            {openExport && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg z-20 overflow-hidden"
              >
                <button
                  onClick={() => chooseExport('excel')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Xuất Excel (.xlsx)
                </button>
                <button
                  onClick={() => chooseExport('pdf')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Xuất PDF (.pdf)
                </button>
                <button
                  onClick={() => chooseExport('csv')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <FileDown className="w-4 h-4 text-sky-600" />
                  Xuất CSV (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">QT</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
