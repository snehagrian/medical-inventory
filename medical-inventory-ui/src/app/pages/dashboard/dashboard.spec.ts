import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Dashboard } from './dashboard';
import { InventoryService } from '../services/inventory.services';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let inventoryService: InventoryService;

  const emptyPageResponse = {
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 10,
    availableCategories: [],
    availableStatuses: []
  };

  const mockInventoryService = {
    allItems: vi.fn(),
    getLowStockItems: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInventoryService.allItems.mockReturnValue(of(emptyPageResponse));
    mockInventoryService.getLowStockItems.mockReturnValue(of(emptyPageResponse));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideNativeDateAdapter(),
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    inventoryService = TestBed.inject(InventoryService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should load all items on init', () => {
    expect(inventoryService.allItems).toHaveBeenCalled();
  });

  it('should switch to low stock view when showLowStockItems is called', () => {
    mockInventoryService.getLowStockItems.mockReturnValue(of(emptyPageResponse));

    component.showLowStockItems();

    expect(component.isLowStockView).toBe(true);
    expect(inventoryService.getLowStockItems).toHaveBeenCalled();
  });

  it('should show pagination controls in low stock view when items span multiple pages', () => {
    component.isLoading = false;
    component.errorMessage = '';
    component.isLowStockView = true;
    component.items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
    component.paginatedItems = [{ id: 3 }, { id: 4 }];
    component.currentPage = 2;
    component.totalPages = 3;

    fixture.detectChanges();

    const pageIndicator = fixture.nativeElement.querySelector('.table-footer .page-indicator');

    expect(pageIndicator).not.toBeNull();
    expect(pageIndicator.textContent).toContain('Page 2 of 3');
  });
});
