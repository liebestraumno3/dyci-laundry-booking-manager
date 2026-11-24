import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Booking, BookingPayload, BookingStatus } from '../models/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/bookings';

  getBookings(): Observable<Booking[]> {
    return this.http
      .get<Booking[]>(this.apiUrl)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('load bookings', error)));
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http
      .get<Booking>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('load booking details', error)));
  }

  createBooking(payload: BookingPayload): Observable<Booking> {
    return this.http
      .post<Booking>(this.apiUrl, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('create booking', error)));
  }

  updateBooking(id: string, booking: Booking): Observable<Booking> {
    return this.http
      .put<Booking>(`${this.apiUrl}/${encodeURIComponent(id)}`, booking)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('update booking', error)));
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http
      .patch<Booking>(`${this.apiUrl}/${encodeURIComponent(id)}`, { status })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('update booking status', error)));
  }

  deleteBooking(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError('delete booking', error)));
  }

  private handleError(action: string, error: HttpErrorResponse): Observable<never> {
    let message: string;

    if (error.status === 0) {
      message = `Unable to ${action}. The local API server (http://localhost:3000) is unreachable. Start json-server and retry.`;
    } else if (error.status === 404) {
      message = `Unable to ${action}. The requested booking record was not found (HTTP 404).`;
    } else {
      message = `Unable to ${action}. API responded with HTTP ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
    }

    return throwError(() => new Error(message));
  }
}
