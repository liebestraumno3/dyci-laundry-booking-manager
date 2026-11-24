import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BookingFormComponent, BookingSubmitEvent } from './components/booking-form/booking-form.component';
import { BookingListComponent } from './components/booking-list/booking-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ActiveView, Booking, BookingStatus } from './models/booking.model';
import { BookingService } from './services/booking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, DashboardComponent, BookingListComponent, BookingFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly bookingService = inject(BookingService);

  readonly activeView = signal<ActiveView>('dashboard');
  readonly bookings = signal<Booking[]>([]);
  readonly editingBooking = signal<Booking | null>(null);
  readonly listInitialStatus = signal<BookingStatus | 'All'>('All');

  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly busyBookingId = signal<string | null>(null);
  readonly apiConnected = signal<boolean>(true);
  readonly apiError = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly pendingCount = computed(
    () => this.bookings().filter((b) => b.status === 'Pending').length
  );

  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(showSyncMessage = false): void {
    this.isLoading.set(true);
    this.apiError.set(null);

    this.bookingService.getBookings().subscribe({
      next: (records) => {
        this.bookings.set(records);
        this.apiConnected.set(true);
        this.isLoading.set(false);
        if (showSyncMessage) {
          this.showFeedback(`Synced ${records.length} booking records from local API.`);
        }
      },
      error: (err: Error) => {
        this.apiConnected.set(false);
        this.isLoading.set(false);
        this.apiError.set(err.message);
      },
    });
  }

  onNavigate(view: ActiveView): void {
    if (view !== 'form') {
      this.editingBooking.set(null);
    }
    if (view === 'bookings') {
      this.listInitialStatus.set('All');
    }
    this.activeView.set(view);
  }

  onOpenNewBooking(): void {
    this.editingBooking.set(null);
    this.activeView.set('form');
  }

  onEditBooking(booking: Booking): void {
    this.editingBooking.set(booking);
    this.activeView.set('form');
  }

  onQuickFilterStatus(status: BookingStatus): void {
    this.listInitialStatus.set(status);
    this.activeView.set('bookings');
  }

  onCancelForm(): void {
    this.editingBooking.set(null);
    this.activeView.set('bookings');
  }

  onSubmitBooking(event: BookingSubmitEvent): void {
    this.isSubmitting.set(true);
    this.apiError.set(null);

    if (event.id) {
      const updatedRecord: Booking = {
        id: event.id,
        ...event.payload,
      };

      this.bookingService.updateBooking(event.id, updatedRecord).subscribe({
        next: (saved) => {
          this.bookings.update((list) =>
            list.map((item) => (item.id === saved.id ? saved : item))
          );
          this.apiConnected.set(true);
          this.isSubmitting.set(false);
          this.editingBooking.set(null);
          this.activeView.set('bookings');
          this.showFeedback(`Updated booking ${saved.id} for ${saved.customerName}.`);
        },
        error: (err: Error) => {
          this.apiConnected.set(false);
          this.isSubmitting.set(false);
          this.apiError.set(err.message);
        },
      });
      return;
    }

    this.bookingService.createBooking(event.payload).subscribe({
      next: (created) => {
        this.bookings.update((list) => [created, ...list]);
        this.apiConnected.set(true);
        this.isSubmitting.set(false);
        this.activeView.set('bookings');
        this.showFeedback(
          `Created booking ${created.id} for ${created.customerName} (₱${created.totalCharge.toFixed(2)}).`
        );
      },
      error: (err: Error) => {
        this.apiConnected.set(false);
        this.isSubmitting.set(false);
        this.apiError.set(err.message);
      },
    });
  }

  onStatusChange(event: { id: string; status: BookingStatus }): void {
    this.busyBookingId.set(event.id);
    this.apiError.set(null);

    this.bookingService.updateBookingStatus(event.id, event.status).subscribe({
      next: (updated) => {
        this.bookings.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item))
        );
        this.apiConnected.set(true);
        this.busyBookingId.set(null);
        this.showFeedback(`Booking ${updated.id} moved to ${updated.status}.`);
      },
      error: (err: Error) => {
        this.apiConnected.set(false);
        this.busyBookingId.set(null);
        this.apiError.set(err.message);
      },
    });
  }

  onDeleteBooking(id: string): void {
    this.busyBookingId.set(id);
    this.apiError.set(null);

    this.bookingService.deleteBooking(id).subscribe({
      next: () => {
        this.bookings.update((list) => list.filter((item) => item.id !== id));
        this.apiConnected.set(true);
        this.busyBookingId.set(null);
        this.showFeedback(`Deleted booking ${id}.`);
      },
      error: (err: Error) => {
        this.apiConnected.set(false);
        this.busyBookingId.set(null);
        this.apiError.set(err.message);
      },
    });
  }

  dismissFeedback(): void {
    this.feedbackMessage.set(null);
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
  }

  dismissError(): void {
    this.apiError.set(null);
  }

  private showFeedback(message: string): void {
    this.feedbackMessage.set(message);
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = setTimeout(() => {
      this.feedbackMessage.set(null);
      this.feedbackTimer = null;
    }, 4500);
  }
}
