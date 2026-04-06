import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  InventoryPageResponse,
  InventoryQueryParams,
  InventoryReportBreakdown,
  InventoryReportSummaryResponse,
  InventoryService
} from '../services/inventory.services';
import { downloadXlsxFile, toIsoDateString, toNumber } from '../services/export-utils';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['../dashboard/dashboard.css', './reports.css']
})
export class Reports implements OnInit, OnDestroy {
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  reportItems: any[] = [];
  paginatedItems: any[] = [];
  allReportItems: any[] = [];

  isLoading = true;
  isSummaryLoading = true;
  errorMessage = '';
  summaryErrorMessage = '';
  reportDate = new Date();
  printContext: 'none' | 'inventory-report' = 'none';

  analyticsTotalItems = 0;
  analyticsLowStockItems = 0;
  analyticsAvailableItems = 0;
  analyticsCategoriesCount = 0;
  analyticsTotalInventoryValue = 0;
  analyticsPieChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  analyticsPieChartBackground = '';
  analyticsDonutChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  analyticsDonutChartBackground = '';

  searchTerm = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  dateRangeError = false;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  sortField: 'quantity' | 'unitPrice' | 'expiryDate' | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  availableCategories: string[] = [];
  availableStatuses: string[] = [];
  displayedColumns = ['id', 'itemName', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'supplierName', 'expiryDate', 'status'];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadReportItems();
      this.loadSummary();
    });

    this.loadReportItems();
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  onFiltersChanged(): void {
    this.dateRangeError = !!(this.dateFrom && this.dateTo && this.dateFrom > this.dateTo);
    if (this.dateRangeError) {
      return;
    }
    this.currentPage = 1;
    this.loadReportItems();
    this.loadSummary();
  }

  onSortFieldChange(): void {
    if (!this.sortField) {
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadReportItems();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadReportItems();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadReportItems();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  printInventoryReport(): void {
    this.fetchAllMatchingItems((items) => {
      this.allReportItems = items;
      this.reportDate = new Date();
      this.printContext = 'inventory-report';
      this.cdr.detectChanges();

      setTimeout(() => {
        globalThis.print();
      }, 50);

      const resetAfterPrint = (): void => {
        this.printContext = 'none';
        this.allReportItems = [];
        globalThis.removeEventListener('afterprint', resetAfterPrint);
      };

      globalThis.addEventListener('afterprint', resetAfterPrint);
    }, 'Failed to prepare the inventory report.');
  }

  exportInventoryAsXlsx(): void {
    this.fetchAllMatchingItems((items) => {
      const rows = items.map((inventoryRecord) => ({
        ID: inventoryRecord.id ?? '',
        'Item Name': inventoryRecord.itemName ?? inventoryRecord.item_name ?? '',
        Category: inventoryRecord.category ?? '',
        Quantity: toNumber(inventoryRecord.quantity),
        'Reorder Level': toNumber(inventoryRecord.reorderLevel ?? inventoryRecord.reorder_level),
        'Unit Price': toNumber(inventoryRecord.unitPrice ?? inventoryRecord.unit_price),
        Supplier: inventoryRecord.supplierName ?? inventoryRecord.supplier_name ?? '',
        'Expiry Date': inventoryRecord.expiryDate ?? inventoryRecord.expiry_date ?? '',
        Status: inventoryRecord.status ?? ''
      }));
      downloadXlsxFile(rows, 'Inventory Report', 'inventory-report');
    }, 'Failed to export inventory report.');
  }

  getReportDateLabel(): string {
    return this.reportDate.toLocaleDateString();
  }

  private loadReportItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.inventoryService.getInventoryReport(this.buildQueryParams()).subscribe({
      next: (response) => {
        if (!this.applyPagedResponse(response)) {
          return;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to load inventory report data.';
        this.isLoading = false;
        console.error('Error fetching report items', error);
        this.cdr.detectChanges();
      }
    });
  }

  private loadSummary(): void {
    this.isSummaryLoading = true;
    this.summaryErrorMessage = '';
    this.inventoryService.getInventoryReportSummary(this.buildSummaryQueryParams()).subscribe({
      next: (response) => {
        this.applySummaryResponse(response);
        this.isSummaryLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.summaryErrorMessage = error?.error || 'Failed to load summary data.';
        this.isSummaryLoading = false;
        this.resetSummary();
        console.error('Error fetching report summary', error);
        this.cdr.detectChanges();
      }
    });
  }

  private applyPagedResponse(response: InventoryPageResponse): boolean {
    const responsePage = (response.page ?? 0) + 1;
    const resolvedTotalPages = Math.max(1, response.totalPages ?? 0);

    if ((response.items?.length ?? 0) === 0 && (response.totalElements ?? 0) > 0 && responsePage > resolvedTotalPages) {
      this.currentPage = resolvedTotalPages;
      this.loadReportItems();
      return false;
    }

    this.reportItems = response.items ?? [];
    this.paginatedItems = [...this.reportItems];
    this.availableCategories = response.availableCategories ?? [];
    this.availableStatuses = response.availableStatuses ?? [];
    this.totalPages = resolvedTotalPages;
    this.currentPage = (response.totalElements ?? 0) === 0 ? 1 : responsePage;

    return true;
  }

  private applySummaryResponse(response: InventoryReportSummaryResponse): void {
    this.analyticsTotalItems = toNumber(response.totalItems);
    this.analyticsLowStockItems = toNumber(response.lowStockItems);
    this.analyticsAvailableItems = toNumber(response.availableItems);
    this.analyticsCategoriesCount = toNumber(response.categoriesCount);
    this.analyticsTotalInventoryValue = toNumber(response.totalInventoryValue);
    this.analyticsPieChartData = this.prepareCategoryPieChartData(response.quantityByCategory ?? []);
    this.analyticsPieChartBackground = this.buildConicGradientBackground(this.analyticsPieChartData);
    this.analyticsDonutChartData = this.prepareStockDonutChartData(response.stockHealth ?? []);
    this.analyticsDonutChartBackground = this.buildConicGradientBackground(this.analyticsDonutChartData);
  }

  private resetSummary(): void {
    this.analyticsTotalItems = 0;
    this.analyticsLowStockItems = 0;
    this.analyticsAvailableItems = 0;
    this.analyticsCategoriesCount = 0;
    this.analyticsTotalInventoryValue = 0;
    this.analyticsPieChartData = [];
    this.analyticsPieChartBackground = '';
    this.analyticsDonutChartData = [];
    this.analyticsDonutChartBackground = '';
  }

  private buildQueryParams(all = false): InventoryQueryParams {
    return {
      page: all ? 0 : Math.max(0, this.currentPage - 1),
      size: all ? undefined : this.pageSize,
      search: this.searchTerm.trim() || undefined,
      category: this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined,
      status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      dateFrom: this.dateFrom ? toIsoDateString(this.dateFrom) : undefined,
      dateTo: this.dateTo ? toIsoDateString(this.dateTo) : undefined,
      sortField: this.sortField || undefined,
      sortDirection: this.sortField ? this.sortDirection : undefined,
      all: all || undefined
    };
  }

  private buildSummaryQueryParams(): InventoryQueryParams {
    return {
      search: this.searchTerm.trim() || undefined,
      category: this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined,
      status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      dateFrom: this.dateFrom ? toIsoDateString(this.dateFrom) : undefined,
      dateTo: this.dateTo ? toIsoDateString(this.dateTo) : undefined
    };
  }

  private fetchAllMatchingItems(onSuccess: (items: any[]) => void, defaultErrorMessage: string): void {
    this.inventoryService.getInventoryReport(this.buildQueryParams(true)).subscribe({
      next: (response) => {
        onSuccess(response.items ?? []);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || defaultErrorMessage;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
        console.error(defaultErrorMessage, error);
      }
    });
  }

  private prepareCategoryPieChartData(records: InventoryReportBreakdown[]): { label: string; value: number; percentage: number; color: string }[] {
    const normalizedRecords = [...records]
      .map((record) => ({
        label: record.label || 'Uncategorized',
        value: toNumber(record.value)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const totalQuantity = normalizedRecords.reduce((total, chartItem) => total + chartItem.value, 0);

    return normalizedRecords.map((chartItem, index) => ({
      ...chartItem,
      percentage: totalQuantity > 0 ? (chartItem.value / totalQuantity) * 100 : 0,
      color: this.getChartColor(index)
    }));
  }

  private prepareStockDonutChartData(records: InventoryReportBreakdown[]): { label: string; value: number; percentage: number; color: string }[] {
    const palette = new Map<string, string>([
      ['In Stock', '#22c55e'],
      ['Low Stock', '#f59e0b'],
      ['Out Of Stock', '#ef4444']
    ]);
    const normalizedRecords = [...records].map((record, index) => ({
      label: record.label,
      value: toNumber(record.value),
      color: palette.get(record.label) ?? this.getChartColor(index)
    }));
    const total = normalizedRecords.reduce((sum, stockItem) => sum + stockItem.value, 0);

    return normalizedRecords.map((stockItem) => ({
      ...stockItem,
      percentage: total > 0 ? (stockItem.value / total) * 100 : 0
    }));
  }

  private buildConicGradientBackground(segments: { percentage: number; color: string }[]): string {
    if (segments.length === 0 || segments.every((segment) => segment.percentage === 0)) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    let currentPercent = 0;
    const stops = segments.map((segment) => {
      const start = currentPercent;
      const end = start + segment.percentage;
      currentPercent = end;
      return `${segment.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }

  private getChartColor(index: number): string {
    const palette = ['#2563eb', '#7c3aed', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444'];
    return palette[index % palette.length];
  }

}
