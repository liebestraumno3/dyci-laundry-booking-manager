import { Component, input, output } from '@angular/core';
import { ActiveView } from '../../models/booking.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  readonly activeView = input.required<ActiveView>();
  readonly totalBookings = input<number>(0);
  readonly pendingCount = input<number>(0);
  readonly apiConnected = input<boolean>(true);
  readonly isLoading = input<boolean>(false);

  readonly navigate = output<ActiveView>();
  readonly newBooking = output<void>();
  readonly refresh = output<void>();

  onNavigate(view: ActiveView): void {
    this.navigate.emit(view);
  }

  onNewBooking(): void {
    this.newBooking.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }
}
