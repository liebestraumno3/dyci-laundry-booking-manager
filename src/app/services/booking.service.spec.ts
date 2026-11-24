import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Booking, BookingPayload } from '../models/booking.model';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  const sampleBooking: Booking = {
    id: 'BK-1001',
    customerName: 'Elena Navarro',
    contactNumber: '0917-482-3190',
    serviceType: 'Wash & Fold',
    weightKg: 6.5,
    isExpress: false,
    bookingDate: '2026-11-24',
    status: 'Washing',
    baseCharge: 292.5,
    expressFee: 0,
    totalCharge: 292.5,
    notes: 'Hypoallergenic detergent.',
    createdAt: '2026-11-24T08:15:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BookingService],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retrieves bookings via GET /bookings', () => {
    let result: Booking[] = [];
    service.getBookings().subscribe((records) => {
      result = records;
    });

    const req = httpMock.expectOne('http://localhost:3000/bookings');
    expect(req.request.method).toBe('GET');
    req.flush([sampleBooking]);

    expect(result).toEqual([sampleBooking]);
  });

  it('creates a booking via POST /bookings', () => {
    const { id: _ignored, ...payload }: Booking = sampleBooking;
    let created: Booking | undefined;

    service.createBooking(payload as BookingPayload).subscribe((record) => {
      created = record;
    });

    const req = httpMock.expectOne('http://localhost:3000/bookings');
    expect(req.request.method).toBe('POST');
    req.flush(sampleBooking);

    expect(created).toEqual(sampleBooking);
  });

  it('updates booking status via PATCH /bookings/:id', () => {
    let updated: Booking | undefined;

    service.updateBookingStatus('BK-1001', 'Ready').subscribe((record) => {
      updated = record;
    });

    const req = httpMock.expectOne('http://localhost:3000/bookings/BK-1001');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'Ready' });
    req.flush({ ...sampleBooking, status: 'Ready' });

    expect(updated?.status).toBe('Ready');
  });

  it('returns an actionable error message when the API server is offline', () => {
    let errorMessage = '';

    service.getBookings().subscribe({
      next: () => {
        throw new Error('Expected request to fail');
      },
      error: (err: Error) => {
        errorMessage = err.message;
      },
    });

    const req = httpMock.expectOne('http://localhost:3000/bookings');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(errorMessage).toContain('http://localhost:3000');
  });
});
