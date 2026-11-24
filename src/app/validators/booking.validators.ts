import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  ABSOLUTE_MAX_WEIGHT_KG,
  MAX_BOOKING_ADVANCE_DAYS,
  MIN_WEIGHT_KG,
  SERVICE_CONFIG_MAP,
  ServiceType,
  formatLocalDateISO,
} from '../models/booking.model';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Custom Control Validator: Enforces physical laundry load weight boundaries.
 * Blocks non-numeric values, loads below minKg, and loads exceeding maxKg.
 */
export function weightLimitValidator(
  maxKg: number = ABSOLUTE_MAX_WEIGHT_KG,
  minKg: number = MIN_WEIGHT_KG
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    const weight = Number(raw);
    if (!Number.isFinite(weight)) {
      return { invalidWeight: { actual: raw } };
    }

    if (weight < minKg) {
      return {
        weightTooLow: {
          actual: weight,
          min: minKg,
        },
      };
    }

    if (weight > maxKg) {
      return {
        weightExceeded: {
          actual: weight,
          max: maxKg,
        },
      };
    }

    return null;
  };
}

/**
 * Custom Cross-Field FormGroup Validator: Validates entered load weight
 * against the drum capacity limit of the currently selected service type.
 */
export function serviceWeightCapacityValidator(group: AbstractControl): ValidationErrors | null {
  const serviceControl = group.get('serviceType');
  const weightControl = group.get('weightKg');

  if (!serviceControl || !weightControl) {
    return null;
  }

  const rawWeight = weightControl.value;
  if (rawWeight === null || rawWeight === undefined || rawWeight === '') {
    return null;
  }

  const serviceType = serviceControl.value as ServiceType;
  const config = SERVICE_CONFIG_MAP[serviceType];
  if (!config) {
    return null;
  }

  const weight = Number(rawWeight);
  if (!Number.isFinite(weight)) {
    return null;
  }

  if (weight > config.maxWeightKg) {
    return {
      machineCapacityExceeded: {
        actual: weight,
        max: config.maxWeightKg,
        serviceType: config.type,
        machineLabel: config.machineLabel,
      },
    };
  }

  return null;
}

/**
 * Custom Control Validator: Prevents past booking dates, impossible calendar
 * dates (e.g., Feb 30), and bookings beyond the allowed advance window.
 * Parses YYYY-MM-DD strictly in local time to prevent UTC timezone drift.
 */
export function noPastDateValidator(
  maxAdvanceDays: number = MAX_BOOKING_ADVANCE_DAYS,
  todayProvider: () => Date = () => new Date()
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    if (typeof raw !== 'string') {
      return { invalidDateFormat: { actual: raw } };
    }

    const match = ISO_DATE_PATTERN.exec(raw.trim());
    if (!match) {
      return { invalidDateFormat: { actual: raw } };
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const parsedDate = new Date(year, month - 1, day);
    const isRealCalendarDate =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;

    if (!isRealCalendarDate) {
      return { invalidDateFormat: { actual: raw } };
    }

    const now = todayProvider();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minDateISO = formatLocalDateISO(today);

    if (parsedDate < today) {
      return {
        pastDate: {
          selectedDate: raw,
          minDate: minDateISO,
        },
      };
    }

    const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + maxAdvanceDays);
    if (parsedDate > maxDate) {
      return {
        dateTooFar: {
          selectedDate: raw,
          maxDate: formatLocalDateISO(maxDate),
          maxAdvanceDays,
        },
      };
    }

    return null;
  };
}

/**
 * Custom Control Validator: Validates phone contact strings allowing digits,
 * spaces, hyphens, parentheses, and optional leading + while enforcing 10–13 digits.
 */
export function contactNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return null;
    }

    const value = String(raw).trim();
    const allowedChars = /^[+\d\s()-]+$/;
    const digitsOnly = value.replace(/\D/g, '');

    if (!allowedChars.test(value) || digitsOnly.length < 10 || digitsOnly.length > 13) {
      return {
        invalidContactNumber: {
          actual: value,
          digitCount: digitsOnly.length,
        },
      };
    }

    return null;
  };
}
