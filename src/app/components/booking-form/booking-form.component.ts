import { CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ABSOLUTE_MAX_WEIGHT_KG,
  BOOKING_STATUSES,
  Booking,
  BookingPayload,
  BookingStatus,
  ChargeBreakdown,
  EXPRESS_SURCHARGE,
  MAX_BOOKING_ADVANCE_DAYS,
  MIN_WEIGHT_KG,
  SERVICE_CATALOG,
  SERVICE_CONFIG_MAP,
  ServiceConfig,
  ServiceType,
  calculateBookingCharges,
  formatLocalDateISO,
} from '../../models/booking.model';
import {
  contactNumberValidator,
  noPastDateValidator,
  serviceWeightCapacityValidator,
  weightLimitValidator,
} from '../../validators/booking.validators';

export interface BookingSubmitEvent {
  id?: string;
  payload: BookingPayload;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css',
})
export class BookingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly editingBooking = input<Booking | null>(null);
  readonly isSubmitting = input<boolean>(false);

  readonly submitBooking = output<BookingSubmitEvent>();
  readonly cancelForm = output<void>();

  readonly services = SERVICE_CATALOG;
  readonly statuses = BOOKING_STATUSES;
  readonly expressSurcharge = EXPRESS_SURCHARGE;
  readonly minWeightKg = MIN_WEIGHT_KG;
  readonly absoluteMaxWeightKg = ABSOLUTE_MAX_WEIGHT_KG;
  readonly maxAdvanceDays = MAX_BOOKING_ADVANCE_DAYS;
  readonly todayISO = formatLocalDateISO(new Date());

  readonly submitted = signal<boolean>(false);

  readonly bookingForm = this.fb.nonNullable.group(
    {
      customerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      contactNumber: ['', [Validators.required, contactNumberValidator()]],
      serviceType: ['Wash & Fold' as ServiceType, [Validators.required]],
      weightKg: [
        3,
        [
          Validators.required,
          weightLimitValidator(ABSOLUTE_MAX_WEIGHT_KG, MIN_WEIGHT_KG),
        ],
      ],
      isExpress: [false],
      bookingDate: [
        this.todayISO,
        [Validators.required, noPastDateValidator(MAX_BOOKING_ADVANCE_DAYS)],
      ],
      status: ['Pending' as BookingStatus, [Validators.required]],
      notes: ['', [Validators.maxLength(240)]],
    },
    {
      validators: [serviceWeightCapacityValidator],
    }
  );

  // Reactive signals kept in sync with Reactive Forms value/status via Observable subscribe()
  readonly chargeBreakdown = signal<ChargeBreakdown>(
    calculateBookingCharges('Wash & Fold', 3, false)
  );
  readonly activeServiceConfig = signal<ServiceConfig>(SERVICE_CONFIG_MAP['Wash & Fold']);
  readonly currentWeight = signal<number>(3);
  readonly validatorSnapshot = signal({
    weightBoundsOk: true,
    machineCapacityOk: true,
    dateValidOk: true,
    contactValidOk: false,
  });

  readonly isEditMode = computed(() => this.editingBooking() !== null);

  readonly capacityPercent = computed(() => {
    const max = this.activeServiceConfig().maxWeightKg;
    const weight = this.currentWeight();
    if (!Number.isFinite(weight) || weight <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((weight / max) * 100));
  });

  readonly isOverMachineCapacity = computed(
    () =>
      this.bookingForm.hasError('machineCapacityExceeded') ||
      this.bookingForm.controls.weightKg.hasError('weightExceeded')
  );

  constructor() {
    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncDerivedState();
      });

    effect(() => {
      const booking = this.editingBooking();
      this.submitted.set(false);

      if (booking) {
        this.bookingForm.reset({
          customerName: booking.customerName,
          contactNumber: booking.contactNumber,
          serviceType: booking.serviceType,
          weightKg: booking.weightKg,
          isExpress: booking.isExpress,
          bookingDate: booking.bookingDate,
          status: booking.status,
          notes: booking.notes,
        });
      } else {
        this.bookingForm.reset({
          customerName: '',
          contactNumber: '',
          serviceType: 'Wash & Fold',
          weightKg: 3,
          isExpress: false,
          bookingDate: formatLocalDateISO(new Date()),
          status: 'Pending',
          notes: '',
        });
      }

      this.syncDerivedState();
    });
  }

  get controls() {
    return this.bookingForm.controls;
  }

  showControlError(controlName: keyof typeof this.bookingForm.controls): boolean {
    const control = this.bookingForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }

  showMachineCapacityError(): boolean {
    const weightControl = this.controls.weightKg;
    return (
      this.bookingForm.hasError('machineCapacityExceeded') &&
      (weightControl.dirty || weightControl.touched || this.controls.serviceType.dirty || this.submitted())
    );
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.bookingForm.markAllAsTouched();
    this.syncDerivedState();

    if (this.bookingForm.invalid) {
      return;
    }

    const raw = this.bookingForm.getRawValue();
    const weightKg = Number(raw.weightKg);
    const charges = calculateBookingCharges(raw.serviceType, weightKg, raw.isExpress);
    const existing = this.editingBooking();

    const payload: BookingPayload = {
      customerName: raw.customerName.trim(),
      contactNumber: raw.contactNumber.trim(),
      serviceType: raw.serviceType,
      weightKg,
      isExpress: raw.isExpress,
      bookingDate: raw.bookingDate,
      status: raw.status,
      baseCharge: charges.baseCharge,
      expressFee: charges.expressFee,
      totalCharge: charges.totalCharge,
      notes: raw.notes.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    this.submitBooking.emit({
      id: existing?.id,
      payload,
    });
  }

  onReset(): void {
    this.submitted.set(false);
    const booking = this.editingBooking();
    if (booking) {
      this.bookingForm.reset({
        customerName: booking.customerName,
        contactNumber: booking.contactNumber,
        serviceType: booking.serviceType,
        weightKg: booking.weightKg,
        isExpress: booking.isExpress,
        bookingDate: booking.bookingDate,
        status: booking.status,
        notes: booking.notes,
      });
    } else {
      this.bookingForm.reset({
        customerName: '',
        contactNumber: '',
        serviceType: 'Wash & Fold',
        weightKg: 3,
        isExpress: false,
        bookingDate: formatLocalDateISO(new Date()),
        status: 'Pending',
        notes: '',
      });
    }
    this.syncDerivedState();
  }

  private syncDerivedState(): void {
    const raw = this.bookingForm.getRawValue();
    const serviceConfig = SERVICE_CONFIG_MAP[raw.serviceType] ?? SERVICE_CATALOG[0];
    const weight = Number(raw.weightKg);

    this.activeServiceConfig.set(serviceConfig);
    this.currentWeight.set(Number.isFinite(weight) ? weight : 0);
    this.chargeBreakdown.set(calculateBookingCharges(raw.serviceType, weight, raw.isExpress));
    this.validatorSnapshot.set({
      weightBoundsOk:
        !this.controls.weightKg.hasError('required') &&
        !this.controls.weightKg.hasError('weightTooLow') &&
        !this.controls.weightKg.hasError('weightExceeded') &&
        !this.controls.weightKg.hasError('invalidWeight'),
      machineCapacityOk: !this.bookingForm.hasError('machineCapacityExceeded'),
      dateValidOk:
        !this.controls.bookingDate.hasError('required') &&
        !this.controls.bookingDate.hasError('pastDate') &&
        !this.controls.bookingDate.hasError('dateTooFar') &&
        !this.controls.bookingDate.hasError('invalidDateFormat'),
      contactValidOk: this.controls.contactNumber.valid,
    });
  }
}
