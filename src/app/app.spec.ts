import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the application and loads bookings on init', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3000/bookings');
    expect(req.request.method).toBe('GET');
    req.flush([]);

    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('WashOps');
    expect(compiled.textContent).toContain('Operations Overview');
  });
});
