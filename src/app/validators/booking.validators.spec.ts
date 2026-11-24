import { FormControl, FormGroup } from '@angular/forms';
import {
  contactNumberValidator,
  noPastDateValidator,
  serviceWeightCapacityValidator,
  weightLimitValidator,
} from './booking.validators';

describe('Custom Booking Validators', () => {
  describe('weightLimitValidator', () => {
    const validator = weightLimitValidator(20, 0.5);

    it('accepts valid weights within machine limits', () => {
      expect(validator(new FormControl(0.5))).toBeNull();
      expect(validator(new FormControl(8.5))).toBeNull();
      expect(validator(new FormControl(20))).toBeNull();
    });

    it('rejects weights below the minimum load limit', () => {
      const error = validator(new FormControl(0.2));
      expect(error).toEqual({ weightTooLow: { actual: 0.2, min: 0.5 } });
    });

    it('rejects weights exceeding the maximum drum limit', () => {
      const error = validator(new FormControl(22.5));
      expect(error).toEqual({ weightExceeded: { actual: 22.5, max: 20 } });
    });

    it('returns null on empty input so Validators.required owns empty checks', () => {
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

  describe('serviceWeightCapacityValidator', () => {
    it('blocks loads exceeding the selected service machine capacity', () => {
      const group = new FormGroup(
        {
          serviceType: new FormControl('Dry Cleaning'),
          weightKg: new FormControl(10),
        },
        { validators: [serviceWeightCapacityValidator] }
      );

      expect(group.hasError('machineCapacityExceeded')).toBe(true);
      expect(group.errors?.['machineCapacityExceeded']).toMatchObject({
        actual: 10,
        max: 8,
        serviceType: 'Dry Cleaning',
      });
    });

    it('passes when weight is within the selected service machine capacity', () => {
      const group = new FormGroup(
        {
          serviceType: new FormControl('Comforter & Bulky'),
          weightKg: new FormControl(18),
        },
        { validators: [serviceWeightCapacityValidator] }
      );

      expect(group.errors).toBeNull();
    });
  });

  describe('noPastDateValidator', () => {
    const fixedToday = () => new Date(2026, 10, 24, 14, 30, 0); // 2026-11-24 local
    const validator = noPastDateValidator(30, fixedToday);

    it('accepts today and future dates within the 30-day window', () => {
      expect(validator(new FormControl('2026-11-24'))).toBeNull();
      expect(validator(new FormControl('2026-12-01'))).toBeNull();
      expect(validator(new FormControl('2026-12-24'))).toBeNull();
    });

    it('rejects past dates', () => {
      const error = validator(new FormControl('2026-11-23'));
      expect(error).toEqual({
        pastDate: {
          selectedDate: '2026-11-23',
          minDate: '2026-11-24',
        },
      });
    });

    it('rejects dates beyond the 30-day booking window', () => {
      const error = validator(new FormControl('2027-01-10'));
      expect(error).toEqual({
        dateTooFar: {
          selectedDate: '2027-01-10',
          maxDate: '2026-12-24',
          maxAdvanceDays: 30,
        },
      });
    });

    it('rejects impossible calendar dates such as Feb 30', () => {
      const error = validator(new FormControl('2026-02-30'));
      expect(error).toEqual({ invalidDateFormat: { actual: '2026-02-30' } });
    });
  });

  describe('contactNumberValidator', () => {
    const validator = contactNumberValidator();

    it('accepts valid 10 to 13 digit contact numbers', () => {
      expect(validator(new FormControl('0917-482-3190'))).toBeNull();
      expect(validator(new FormControl('+63 917 482 3190'))).toBeNull();
    });

    it('rejects too-short or invalid strings', () => {
      expect(validator(new FormControl('0917-12'))).toBeTruthy();
      expect(validator(new FormControl('abc-1234-5678'))).toBeTruthy();
    });
  });
});
