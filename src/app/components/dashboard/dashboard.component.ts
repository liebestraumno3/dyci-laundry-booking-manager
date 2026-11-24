import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  Booking,
  BookingStatus,
  SERVICE_CATALOG,
  ServiceType,
} from '../../models/booking.model';

interface ServiceSummary {
  type: ServiceType;
  ratePerKg: number;
  maxWeightKg: number;
  machineLabel: string;
  count: number;
  totalKg: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly bookings = input.required<Booking[]>();
  readonly isLoading = input<boolean>(false);

  readonly openNewBooking = output<void>();
  readonly viewAllBookings = output<void>();
  readonly editBooking = output<Booking>();
  readonly quickFilterStatus = output<BookingStatus>();

  readonly skeletonSlots = [1, 2, 3, 4];

  readonly stats = computed(() => {
    const list = this.bookings();
    const totalBookings = list.length;
    const pendingCount = list.filter((b) => b.status === 'Pending').length;
    const washingCount = list.filter((b) => b.status === 'Washing').length;
    const readyCount = list.filter((b) => b.status === 'Ready').length;
    const expressCount = list.filter((b) => b.isExpress).length;
    const totalWeightKg = list.reduce((sum, b) => sum + b.weightKg, 0);
    const totalRevenue = list.reduce((sum, b) => sum + b.totalCharge, 0);

    return {
      totalBookings,
      activeCount: pendingCount + washingCount,
      pendingCount,
      washingCount,
      readyCount,
      expressCount,
      totalWeightKg,
      totalRevenue,
    };
  });

  readonly recentBookings = computed(() =>
    [...this.bookings()]
      .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate) || b.id.localeCompare(a.id))
      .slice(0, 5)
  );

  readonly serviceSummaries = computed<ServiceSummary[]>(() => {
    const list = this.bookings();
    return SERVICE_CATALOG.map((service) => {
      const matching = list.filter((b) => b.serviceType === service.type);
      return {
        type: service.type,
        ratePerKg: service.ratePerKg,
        maxWeightKg: service.maxWeightKg,
        machineLabel: service.machineLabel,
        count: matching.length,
        totalKg: matching.reduce((sum, b) => sum + b.weightKg, 0),
        revenue: matching.reduce((sum, b) => sum + b.totalCharge, 0),
      };
    });
  });
}
