import { SubscriberData, KPIData } from '../types';

// Mock data for development
export const mockSubscriberData: SubscriberData[] = [
  {
    TYPE: 'PREPAID',
    STA_TYPE: 'ACTIVE',
    SUB_ID: 'SUB001',
    SUB_TYPE: 'INDIVIDUAL',
    STA_DATE: '2024-01-15',
    END_DATE: '2024-12-31',
    PROVINCE: 'Hà Nội',
    DISTRICT: 'Ba Đình',
    PCK_CODE: 'ST70',
    PCK_DATE: '2024-01-15',
    PCK_CHARGE: 70000
  },
  {
    TYPE: 'POSTPAID',
    STA_TYPE: 'ACTIVE',
    SUB_ID: 'SUB002',
    SUB_TYPE: 'ENTERPRISE',
    STA_DATE: '2024-01-20',
    END_DATE: '2024-12-31',
    PROVINCE: 'TP. Hồ Chí Minh',
    DISTRICT: 'Quận 1',
    PCK_CODE: 'ST200',
    PCK_DATE: '2024-01-20',
    PCK_CHARGE: 200000
  },
  {
    TYPE: 'PREPAID',
    STA_TYPE: 'INACTIVE',
    SUB_ID: 'SUB003',
    SUB_TYPE: 'INDIVIDUAL',
    STA_DATE: '2024-02-01',
    END_DATE: '2024-02-28',
    PROVINCE: 'Đà Nẵng',
    DISTRICT: 'Hải Châu',
    PCK_CODE: 'ST50',
    PCK_DATE: '2024-02-01',
    PCK_CHARGE: 50000
  },
  {
    TYPE: 'POSTPAID',
    STA_TYPE: 'ACTIVE',
    SUB_ID: 'SUB004',
    SUB_TYPE: 'INDIVIDUAL',
    STA_DATE: '2024-02-10',
    END_DATE: '2024-12-31',
    PROVINCE: 'Hà Nội',
    DISTRICT: 'Cầu Giấy',
    PCK_CODE: 'ST150',
    PCK_DATE: '2024-02-10',
    PCK_CHARGE: 150000
  },
  {
    TYPE: 'PREPAID',
    STA_TYPE: 'ACTIVE',
    SUB_ID: 'SUB005',
    SUB_TYPE: 'INDIVIDUAL',
    STA_DATE: '2024-02-15',
    END_DATE: '2024-12-31',
    PROVINCE: 'TP. Hồ Chí Minh',
    DISTRICT: 'Quận 7',
    PCK_CODE: 'ST90',
    PCK_DATE: '2024-02-15',
    PCK_CHARGE: 90000
  }
];

export const mockKPIData: KPIData = {
  totalSubscribers: 1247,
  activeSubscribers: 1089,
  totalRevenue: 234567000,
  growthRate: 12.5
};

export const provinces = [
  'Tất cả',
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn'
];

export const districts: Record<string, string[]> = {
  'Hà Nội': ['Tất cả', 'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa'],
  'TP. Hồ Chí Minh': ['Tất cả', 'Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Bình Thạnh'],
  'Đà Nẵng': ['Tất cả', 'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ']
};