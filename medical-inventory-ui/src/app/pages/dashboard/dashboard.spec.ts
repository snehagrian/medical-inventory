import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Dashboard } from './dashboard';
import { InventoryService } from '../services/inventory.services';
import { AuthService } from '../services/auth.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let inventoryService: InventoryService;
  let authService: AuthService;
  let router: Router;

  const mockInventoryService = {
    allItems: vi.fn(),
    getLowStockItems: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn()
  };

  const mockAuthService = {
    login: vi.fn(),
    register: vi.fn(),
    getToken: vi.fn(),
    saveToken: vi.fn(),
    clearToken: vi.fn(),
    isLoggedIn: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInventoryService.allItems.mockReturnValue(of([]));
    mockInventoryService.getLowStockItems.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    inventoryService = TestBed.inject(InventoryService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should load all items on init', () => {
    expect(inventoryService.allItems).toHaveBeenCalled();
  });

  it('should clear token and navigate to / on logout', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.logout();

    expect(authService.clearToken).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/']);
  });

  it('should switch to low stock view when showLowStockItems is called', () => {
    mockInventoryService.getLowStockItems.mockReturnValue(of([]));

    component.showLowStockItems();

    expect(component.isLowStockView).toBe(true);
    expect(inventoryService.getLowStockItems).toHaveBeenCalled();
  });
});
