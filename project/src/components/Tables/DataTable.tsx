import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { SubscriberData } from '../../types';

interface DataTableProps {
  data: SubscriberData[];
  title: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, title }) => {
  const [sortField, setSortField] = useState<keyof SubscriberData>('STA_DATE');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const handleSort = (field: keyof SubscriberData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Lọc dữ liệu theo searchTerm (dùng useMemo để tối ưu hiệu năng)
  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.values(item)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Sắp xếp dữ liệu (dùng useMemo để tối ưu hiệu năng)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (sortDirection === 'asc') {
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return aValue - bValue;
        }
        return String(aValue).localeCompare(String(bValue), 'vi');
      } else {
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return bValue - aValue;
        }
        return String(bValue).localeCompare(String(aValue), 'vi');
      }
    });
  }, [filteredData, sortField, sortDirection]);

  // Phân trang (dùng useMemo để tối ưu hiệu năng)
  const paginatedData = useMemo(() => {
    return sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const SortIcon = ({ field }: { field: keyof SubscriberData }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">{title}</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('SUB_ID')}>
                <div className="flex items-center space-x-1">
                  <span>Mã thuê bao</span>
                  <SortIcon field="SUB_ID" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('TYPE')}>
                <div className="flex items-center space-x-1">
                  <span>Loại</span>
                  <SortIcon field="TYPE" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('STA_TYPE')}>
                <div className="flex items-center space-x-1">
                  <span>Trạng thái</span>
                  <SortIcon field="STA_TYPE" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('PROVINCE')}>
                <div className="flex items-center space-x-1">
                  <span>Tỉnh/TP</span>
                  <SortIcon field="PROVINCE" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('DISTRICT')}>
                <div className="flex items-center space-x-1">
                  <span>Quận/Huyện</span>
                  <SortIcon field="DISTRICT" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('PCK_CHARGE')}>
                <div className="flex items-center space-x-1">
                  <span>Cước phí</span>
                  <SortIcon field="PCK_CHARGE" />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('STA_DATE')}>
                <div className="flex items-center space-x-1">
                  <span>Ngày kích hoạt</span>
                  <SortIcon field="STA_DATE" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.SUB_ID} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <td className="py-3 px-4 font-medium text-blue-600">{item.SUB_ID}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.TYPE === 'PREPAID' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.TYPE === 'PREPAID' ? 'Trả trước' : 'Trả sau'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.STA_TYPE === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.STA_TYPE === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="py-3 px-4">{item.PROVINCE}</td>
                <td className="py-3 px-4">{item.DISTRICT}</td>
                <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(Number(item.PCK_CHARGE))}</td>
                <td className="py-3 px-4">{formatDate(item.STA_DATE)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} 
            trong tổng số {sortedData.length} bản ghi
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;