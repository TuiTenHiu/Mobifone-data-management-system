export interface SubscriberData {
  SUB_ID: string;
  TYPE: string;
  STA_TYPE: string;
  SUB_TYPE: string;
  STA_DATE: string;
  END_DATE: string | null;
  PROVINCE: string;
  DISTRICT: string;
  PCK_CODE: string;
  PCK_DATE: string;
  PCK_CHARGE: number;
  // Additional fields from JOIN queries
  sta_type_name?: string;
  sub_type_name?: string;
  district_name?: string;
}

export interface FilterParams {
  type?: string;
  province?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
  subType?: string;
}

export interface KPIData {
  totalSubscribers: number;
  activeSubscribers: number;
  totalRevenue: number;
  growthRate: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}