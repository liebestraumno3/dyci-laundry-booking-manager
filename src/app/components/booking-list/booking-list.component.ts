import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BOOKING_STATUSES,
  Booking,
  BookingStatus,
  SERVICE_CATALOG,
  ServiceType,
} from '../../models/booking.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.css',
})
export class BookingListComponent {
  readonly bookings = input.required<Booking[]>();
  readonly isLoading = input<boolean>(false);
  readonly busyBookingId = input<string | null>(null);
  readonly initialStatusFilter = input<BookingStatus | 'All'>('All');

  readonly editBooking = output<Booking>();
  readonly deleteBooking = output<string>();
  readonly statusChange = output<{ id: string; status: BookingStatus }>();
  readonly createNew = output<void>();

  readonly statuses = BOOKING_STATUSES;
  readonly services = SERVICE_CATALOG;
  readonly skeletonRows = [1, 2, 3, 4, 5];

  // Two-way bound via [(ngModel)] in the template
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<BookingStatus | 'All'>('All');
  readonly serviceFilter = signal<ServiceType | 'All'>('All');
  readonly expressOnly = signal<boolean>(false);

  // Local UI state for inline row delete confirmation
  readonly confirmDeleteId = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.statusFilter.set(this.initialStatusFilter());
    });
  }

  readonly filteredBookings = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const service = this.serviceFilter();
    const expressOnly = this.expressOnly();

    return this.bookings()
      .filter((booking) => {
        if (status !== 'All' && booking.status !== status) {
          return false;
        }
        if (service !== 'All' && booking.serviceType !== service) {
          return false;
        }
        if (expressOnly && !booking.isExpress) {
          return false;
        }
        if (query.length > 0) {
          const haystack = `${booking.id} ${booking.customerName} ${booking.contactNumber} ${booking.notes}`.toLowerCase();
          return haystack.includes(query);
        }
        return true;
      })
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate) || a.id.localeCompare(b.id));
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.statusFilter() !== 'All' ||
      this.serviceFilter() !== 'All' ||
      this.expressOnly()
  );

  readonly filteredTotalWeight = computed(() =>
    this.filteredBookings().reduce((sum, item) => sum + item.weightKg, 0)
  );

  readonly filteredTotalRevenue = computed(() =>
    this.filteredBookings().reduce((sum, item) => sum + item.totalCharge, 0)
  );

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('All');
    this.serviceFilter.set('All');
    this.expressOnly.set(false);
  }

  onAdvanceStatus(booking: Booking, nextStatus: BookingStatus): void {
    this.confirmDeleteId.set(null);
    this.statusChange.emit({ id: booking.id, status: nextStatus });
  }

  requestDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: string): void {
    this.confirmDeleteId.set(null);
    this.deleteBooking.emit(id);
  }
}
