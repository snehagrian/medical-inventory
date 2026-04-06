import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Reports } from './reports';
import { InventoryService } from '../services/inventory.services';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let inventoryService: InventoryService;

  const pageResponse = {
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 10,
    availableCategories: [],
    availableStatuses: []
  };

  const summaryResponse = {
    totalItems: 12,
    lowStockItems: 3,
    availableItems: 8,
    categoriesCount: 4,
    totalInventoryValue: 24500,
    quantityByCategory: [{ label: 'Fixation', value: 40 }],
    stockHealth: [
      { label: 'In Stock', value: 7 },
      { label: 'Low Stock', value: 3 },
      { label: 'Out Of Stock', value: 2 }
    ]
  };

  const mockInventoryService = {
    getInventoryReport: vi.fn(),
    getInventoryReportSummary: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInventoryService.getInventoryReport.mockReturnValue(of(pageResponse));
    mockInventoryService.getInventoryReportSummary.mockReturnValue(of(summaryResponse));

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideNativeDateAdapter(),
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    inventoryService = TestBed.inject(InventoryService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should load report rows and summary data on init', () => {
    expect(inventoryService.getInventoryReport).toHaveBeenCalled();
    expect(inventoryService.getInventoryReportSummary).toHaveBeenCalled();
  });

  it('should render a read-only table without actions column', () => {
    component.isLoading = false;
    component.errorMessage = '';
    component.reportItems = [{
      id: 1,
      itemName: 'Pedicle Screw 6.5mm',
      category: 'Fixation',
      quantity: 40,
      reorderLevel: 10,
      unitPrice: 1250,
      supplierName: 'MedSuppliers',
      expiryDate: '2026-12-31',
      status: 'Available'
    }];
    component.paginatedItems = [...component.reportItems];

    fixture.detectChanges();

    const tableText = fixture.nativeElement.querySelector('.inventory-mat-table')?.textContent ?? '';

    expect(tableText).toContain('Pedicle Screw 6.5mm');
    expect(tableText).not.toContain('Actions');
    expect(tableText).not.toContain('edit');
    expect(tableText).not.toContain('delete');
  });
});
