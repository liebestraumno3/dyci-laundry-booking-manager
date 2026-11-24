export type ServiceType =
  | 'Wash & Fold'
  | 'Wash & Iron'
  | 'Dry Cleaning'
  | 'Comforter & Bulky';

export type BookingStatus = 'Pending' | 'Washing' | 'Ready' | 'Completed';

export type ActiveView = 'dashboard' | 'bookings' | 'form';

export interface Booking {
  id: string;
  customerName: string;
  contactNumber: string;
  serviceType: ServiceType;
  weightKg: number;
  isExpress: boolean;
  bookingDate: string; // ISO calendar date: YYYY-MM-DD
  status: BookingStatus;
  baseCharge: number;
  expressFee: number;
  totalCharge: number;
  notes: string;
  createdAt: string;
}

export type BookingPayload = Omit<Booking, 'id'>;

export interface ServiceConfig {
  type: ServiceType;
  ratePerKg: number;
  minWeightKg: number;
  maxWeightKg: number;
  machineLabel: string;
  standardTurnaround: string;
}

export interface ChargeBreakdown {
  ratePerKg: number;
  baseCharge: number;
  expressFee: number;
  totalCharge: number;
}

export const EXPRESS_SURCHARGE = 100;
export const MIN_WEIGHT_KG = 0.5;
export const ABSOLUTE_MAX_WEIGHT_KG = 20;
export const MAX_BOOKING_ADVANCE_DAYS = 30;

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'Pending',
  'Washing',
  'Ready',
  'Completed',
];

export const SERVICE_CATALOG: readonly ServiceConfig[] = [
  {
    type: 'Wash & Fold',
    ratePerKg: 45,
    minWeightKg: 0.5,
    maxWeightKg: 15,
    machineLabel: 'Standard Drum (Max 15 kg)',
    standardTurnaround: '24 hrs',
  },
  {
    type: 'Wash & Iron',
    ratePerKg: 65,
    minWeightKg: 0.5,
    maxWeightKg: 12,
    machineLabel: 'Care & Press Drum (Max 12 kg)',
    standardTurnaround: '36 hrs',
  },
  {
    type: 'Dry Cleaning',
    ratePerKg: 120,
    minWeightKg: 0.5,
    maxWeightKg: 8,
    machineLabel: 'Solvent Unit (Max 8 kg)',
    standardTurnaround: '48 hrs',
  },
  {
    type: 'Comforter & Bulky',
    ratePerKg: 85,
    minWeightKg: 0.5,
    maxWeightKg: 20,
    machineLabel: 'Heavy-Duty Extractor (Max 20 kg)',
    standardTurnaround: '36 hrs',
  },
];

export const SERVICE_CONFIG_MAP: Record<ServiceType, ServiceConfig> = {
  'Wash & Fold': SERVICE_CATALOG[0],
  'Wash & Iron': SERVICE_CATALOG[1],
  'Dry Cleaning': SERVICE_CATALOG[2],
  'Comforter & Bulky': SERVICE_CATALOG[3],
};

export function calculateBookingCharges(
  serviceType: ServiceType,
  weightKg: number,
  isExpress: boolean
): ChargeBreakdown {
  const config = SERVICE_CONFIG_MAP[serviceType] ?? SERVICE_CATALOG[0];
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  const baseCharge = Math.round(safeWeight * config.ratePerKg * 100) / 100;
  const expressFee = isExpress && safeWeight > 0 ? EXPRESS_SURCHARGE : 0;
  const totalCharge = Math.round((baseCharge + expressFee) * 100) / 100;

  return {
    ratePerKg: config.ratePerKg,
    baseCharge,
    expressFee,
    totalCharge,
  };
}

export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
