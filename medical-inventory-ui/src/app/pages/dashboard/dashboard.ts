import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../services/inventory.services';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  items: any[] = [];
  analyticsItems: any[] = [];
  filteredItems: any[] = [];
  paginatedItems: any[] = [];
  orderItems: any[] = [];

  isLoading = true;
  errorMessage = '';
  isLowStockView = false;
  showAnalytics = false;
  showReorderModal = false;
  reportDate = new Date();
  printContext: 'none' | 'all-items' | 'reorder' = 'none';

  analyticsTotalItems = 0;
  analyticsLowStockItems = 0;
  analyticsAvailableItems = 0;
  analyticsCategoriesCount = 0;
  analyticsPieChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  analyticsPieChartBackground = '';
  analyticsDonutChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  analyticsDonutChartBackground = '';
  analyticsStockFilter: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_IN_STOCK' = 'ALL';

  searchTerm = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';

  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  sortField: 'quantity' | 'unitPrice' | 'expiryDate' | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  availableCategories: string[] = [];
  availableStatuses: string[] = [];

  showFormModal = false;
  isEditMode = false;
  selectedEditId: number | null = null;
  itemForm: any = {
    itemName: '',
    category: '',
    quantity: 0,
    reorderLevel: 0,
    unitPrice: 0,
    supplierName: '',
    expiryDate: '',
    status: 'AVAILABLE'
  };

  reorderForm: any = {
    id: null,
    itemName: '',
    category: '',
    quantity: 0,
    reorderLevel: 0,
    expiryDate: '',
    supplierName: '',
    unitPrice: 0,
    suggestedOrderQuantity: 0,
    orderQuantity: 0
  };

  constructor(
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.showAllItems();
  }

  showAllItems(): void {
    this.isLowStockView = false;
    this.loadAllItems();
  }

  showLowStockItems(): void {
    this.isLowStockView = true;
    this.loadLowStockItems();
  }

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
    if (this.showAnalytics) {
      this.updateAnalyticsData();
    }
  }

  onAnalyticsStockFilterChange(filter: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_IN_STOCK'): void {
    this.analyticsStockFilter = filter;
    this.updateAnalyticsData();
  }

  calculatePriority(item: any): 'High' | 'Medium' | 'Low' {
    const quantity = this.toNumber(item?.quantity);
    const reorderLevel = this.toNumber(item?.reorderLevel);

    if (reorderLevel <= 0) {
      return 'Low';
    }

    if (quantity <= reorderLevel * 0.5) {
      return 'High';
    }

    if (quantity <= reorderLevel) {
      return 'Medium';
    }

    return 'Low';
  }

  getPriorityBadgeClass(item: any): string {
    const priority = this.calculatePriority(item);
    if (priority === 'High') {
      return 'priority-high';
    }
    if (priority === 'Medium') {
      return 'priority-medium';
    }
    return 'priority-low';
  }

  getSuggestedOrderQuantity(item: any): number {
    const quantity = this.toNumber(item?.quantity);
    const reorderLevel = this.toNumber(item?.reorderLevel);
    return Math.max(0, reorderLevel - quantity);
  }

  isOrderItemSelected(item: any): boolean {
    const itemId = item?.id ?? null;
    if (itemId === null) {
      return false;
    }
    return this.orderItems.some((orderItem) => orderItem.id === itemId);
  }

  areAllLowStockSelected(): boolean {
    if (!this.isLowStockView || this.filteredItems.length === 0) {
      return false;
    }

    return this.filteredItems.every((inventoryRecord) => this.isOrderItemSelected(inventoryRecord));
  }

  toggleOrderSelection(item: any, isSelected: boolean): void {
    if (isSelected) {
      const suggestedOrderQuantity = this.getSuggestedOrderQuantity(item);
      const orderItem = {
        id: item?.id ?? null,
        itemName: item?.itemName ?? item?.item_name ?? '',
        category: item?.category ?? '',
        quantity: this.toNumber(item?.quantity),
        reorderLevel: this.toNumber(item?.reorderLevel ?? item?.reorder_level),
        expiryDate: item?.expiryDate ?? item?.expiry_date ?? '',
        supplierName: item?.supplierName ?? item?.supplier_name ?? '',
        unitPrice: this.toNumber(item?.unitPrice ?? item?.unit_price),
        suggestedOrderQuantity,
        orderQuantity: suggestedOrderQuantity > 0 ? suggestedOrderQuantity : 1,
        priority: this.calculatePriority(item)
      };

      const existingItemIndex = this.orderItems.findIndex((existingItem) => existingItem.id === orderItem.id);
      if (existingItemIndex > -1) {
        this.orderItems[existingItemIndex] = orderItem;
      } else {
        this.orderItems.push(orderItem);
      }
      return;
    }

    const itemId = item?.id ?? null;
    if (itemId === null) {
      return;
    }
    this.orderItems = this.orderItems.filter((orderItem) => orderItem.id !== itemId);
  }

  toggleSelectAllLowStockItems(isSelected: boolean): void {
    this.filteredItems.forEach((inventoryRecord) => {
      this.toggleOrderSelection(inventoryRecord, isSelected);
    });
  }

  openReorderModal(item: any): void {
    const suggestedOrderQuantity = this.getSuggestedOrderQuantity(item);

    this.reorderForm = {
      id: item?.id ?? null,
      itemName: item?.itemName ?? item?.item_name ?? '',
      category: item?.category ?? '',
      quantity: this.toNumber(item?.quantity),
      reorderLevel: this.toNumber(item?.reorderLevel ?? item?.reorder_level),
      expiryDate: item?.expiryDate ?? item?.expiry_date ?? '',
      supplierName: item?.supplierName ?? item?.supplier_name ?? '',
      unitPrice: this.toNumber(item?.unitPrice ?? item?.unit_price),
      suggestedOrderQuantity,
      orderQuantity: suggestedOrderQuantity > 0 ? suggestedOrderQuantity : 1
    };

    this.showReorderModal = true;
  }

  closeReorderModal(): void {
    this.showReorderModal = false;
    this.reorderForm = {
      id: null,
      itemName: '',
      category: '',
      quantity: 0,
      reorderLevel: 0,
      expiryDate: '',
      supplierName: '',
      unitPrice: 0,
      suggestedOrderQuantity: 0,
      orderQuantity: 0
    };
  }

  addToOrderList(): void {
    const orderQuantity = Math.max(1, this.toNumber(this.reorderForm.orderQuantity));
    const suggestedOrderQuantity = Math.max(1, this.toNumber(this.reorderForm.suggestedOrderQuantity));

    const orderItem = {
      id: this.reorderForm.id,
      itemName: this.reorderForm.itemName,
      category: this.reorderForm.category,
      quantity: this.toNumber(this.reorderForm.quantity),
      reorderLevel: this.toNumber(this.reorderForm.reorderLevel),
      expiryDate: this.reorderForm.expiryDate,
      supplierName: this.reorderForm.supplierName,
      unitPrice: this.toNumber(this.reorderForm.unitPrice),
      suggestedOrderQuantity,
      orderQuantity,
      priority: this.calculatePriority(this.reorderForm)
    };

    if (orderItem.id === null) {
      this.orderItems.push(orderItem);
    } else {
      const existingItemIndex = this.orderItems.findIndex((existingItem) => existingItem.id === orderItem.id);
      if (existingItemIndex > -1) {
        this.orderItems[existingItemIndex] = orderItem;
      } else {
        this.orderItems.push(orderItem);
      }
    }

    this.closeReorderModal();
  }

  removeOrderItem(index: number): void {
    this.orderItems.splice(index, 1);
  }

  printReorderReport(): void {
    this.reportDate = new Date();
    this.printContext = 'reorder';
    setTimeout(() => {
      globalThis.print();
    }, 50);

    const resetAfterPrint = (): void => {
      this.printContext = 'none';
      globalThis.removeEventListener('afterprint', resetAfterPrint);
    };

    globalThis.addEventListener('afterprint', resetAfterPrint);
  }

  printAllItemsReport(): void {
    this.reportDate = new Date();
    this.printContext = 'all-items';
    setTimeout(() => {
      globalThis.print();
    }, 50);

    const resetAfterPrint = (): void => {
      this.printContext = 'none';
      globalThis.removeEventListener('afterprint', resetAfterPrint);
    };

    globalThis.addEventListener('afterprint', resetAfterPrint);
  }

  exportAllItemsAsCsv(): void {
    const allItemsData = this.filteredItems.map((inventoryRecord) => ({
      id: inventoryRecord.id ?? '',
      item_name: inventoryRecord.itemName ?? inventoryRecord.item_name ?? '',
      category: inventoryRecord.category ?? '',
      quantity: this.toNumber(inventoryRecord.quantity),
      reorder_level: this.toNumber(inventoryRecord.reorderLevel ?? inventoryRecord.reorder_level),
      unit_price: this.toNumber(inventoryRecord.unitPrice ?? inventoryRecord.unit_price),
      supplier_name: inventoryRecord.supplierName ?? inventoryRecord.supplier_name ?? '',
      expiry_date: inventoryRecord.expiryDate ?? inventoryRecord.expiry_date ?? '',
      status: inventoryRecord.status ?? ''
    }));

    this.downloadCsvFile(allItemsData, 'all-items-report');
  }

  exportLowStockAsCsv(): void {
    const lowStockData = this.orderItems.map((orderItem) => ({
      item_name: orderItem.itemName ?? '',
      category: orderItem.category ?? '',
      current_quantity: this.toNumber(orderItem.quantity),
      reorder_level: this.toNumber(orderItem.reorderLevel),
      suggested_quantity: this.toNumber(orderItem.suggestedOrderQuantity),
      order_quantity: this.toNumber(orderItem.orderQuantity),
      expiry_date: orderItem.expiryDate ?? '',
      supplier_name: orderItem.supplierName ?? '',
      priority: orderItem.priority ?? ''
    }));

    this.downloadCsvFile(lowStockData, 'low-stock-order-list');
  }

  getReportDateLabel(): string {
    return this.reportDate.toLocaleDateString();
  }

  applySearchAndFilters(): void {
    const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();

    const filtered = this.items.filter((inventoryRecord) => {
      const itemName = (inventoryRecord.itemName ?? '').toString().toLowerCase();
      const category = (inventoryRecord.category ?? '').toString().toLowerCase();
      const supplierName = (inventoryRecord.supplierName ?? '').toString().toLowerCase();
      const status = (inventoryRecord.status ?? '').toString();

      const matchesSearch =
        !normalizedSearchTerm ||
        itemName.includes(normalizedSearchTerm) ||
        category.includes(normalizedSearchTerm) ||
        supplierName.includes(normalizedSearchTerm);

      const matchesCategory =
        this.selectedCategory === 'ALL' || inventoryRecord.category === this.selectedCategory;

      const matchesStatus = this.selectedStatus === 'ALL' || status === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.filteredItems = this.applySorting(filtered);
    this.calculatePagination();
    this.cdr.detectChanges();
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
    this.applySearchAndFilters();
  }

  onSortFieldChange(): void {
    if (!this.sortField) {
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applySearchAndFilters();
  }

  toggleSortDirection(): void {
    if (!this.sortField) {
      return;
    }
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.currentPage = 1;
    this.applySearchAndFilters();
  }

  onSort(field: 'quantity' | 'unitPrice' | 'expiryDate'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applySearchAndFilters();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = Number(pageSize);
    this.currentPage = 1;
    this.calculatePagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.calculatePagination();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getCurrentPageItems(): any[] {
    return this.paginatedItems;
  }

  saveItem(): void {
    if (this.isEditMode && this.selectedEditId !== null) {
      this.inventoryService.updateItem(this.selectedEditId, this.itemForm).subscribe({
        next: () => {
          this.closeForm();
          this.reloadCurrentView();
        },
        error: (error) => {
          this.errorMessage = error?.error || 'Failed to update inventory item.';
          console.error('Error updating inventory item', error);
        }
      });
      return;
    }

    this.inventoryService.addItem(this.itemForm).subscribe({
      next: () => {
        this.closeForm();
        this.reloadCurrentView();
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to add inventory item.';
        console.error('Error adding inventory item', error);
      }
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.selectedEditId = null;
    this.resetForm();
    this.showFormModal = true;
  }

  openEditForm(item: any): void {
    this.isEditMode = true;
    this.selectedEditId = item.id;
    this.itemForm = {
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      supplierName: item.supplierName,
      expiryDate: item.expiryDate,
      status: item.status
    };
    this.showFormModal = true;
  }

  onEdit(item: any): void {
    this.openEditForm(item);
  }

  onDelete(id: number): void {
    this.inventoryService.deleteItem(id).subscribe({
      next: () => {
        this.reloadCurrentView();
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to delete inventory item.';
        console.error('Error deleting inventory item', error);
      }
    });
  }

  closeForm(): void {
    this.showFormModal = false;
    this.isEditMode = false;
    this.selectedEditId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.itemForm = {
      itemName: '',
      category: '',
      quantity: 0,
      reorderLevel: 0,
      unitPrice: 0,
      supplierName: '',
      expiryDate: '',
      status: 'AVAILABLE'
    };
  }

  private reloadCurrentView(): void {
    if (this.isLowStockView) {
      this.showLowStockItems();
      return;
    }
    this.showAllItems();
  }

  private loadAllItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.inventoryService.allItems().subscribe({
      next: (response) => {
        this.items = this.normalizeItemsResponse(response);
        this.analyticsItems = [...this.items];
        this.updateAnalyticsData();
        this.initializeFilterOptions();
        this.applySearchAndFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load inventory items.';
        this.isLoading = false;
        console.error('Error fetching inventory items', error);
        this.cdr.detectChanges();
      }
    });
  }

  private loadLowStockItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.inventoryService.getLowStockItems().subscribe({
      next: (response) => {
        this.items = this.normalizeItemsResponse(response);
        if (this.analyticsItems.length === 0) {
          this.analyticsItems = [...this.items];
        }
        this.updateAnalyticsData();
        this.initializeFilterOptions();
        this.applySearchAndFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to load low stock items.';
        this.isLoading = false;
        console.error('Error fetching low stock items', error);
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeItemsResponse(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    const wrappedResponse = response as { items?: any[]; content?: any[]; data?: any[] };
    return wrappedResponse.items ?? wrappedResponse.content ?? wrappedResponse.data ?? [];
  }

  private initializeFilterOptions(): void {
    this.availableCategories = Array.from(
      new Set(this.items.map((inventoryRecord) => inventoryRecord.category).filter(Boolean))
    );

    this.availableStatuses = Array.from(
      new Set(this.items.map((inventoryRecord) => inventoryRecord.status).filter(Boolean))
    );
  }

  private applySorting(records: any[]): any[] {
    if (!this.sortField) {
      return [...records];
    }

    const multiplier = this.sortDirection === 'asc' ? 1 : -1;

    return [...records].sort((a, b) => {
      let aValue: any = a[this.sortField];
      let bValue: any = b[this.sortField];

      if (this.sortField === 'expiryDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) {
        return -1 * multiplier;
      }
      if (aValue > bValue) {
        return 1 * multiplier;
      }
      return 0;
    });
  }

  private calculatePagination(): void {
    const totalItems = this.filteredItems.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.filteredItems.slice(startIndex, endIndex);
  }

  private toNumber(value: any): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private updateAnalyticsData(): void {
    const records = this.analyticsItems.length > 0 ? this.analyticsItems : this.items;
    const filteredChartRecords = this.filterAnalyticsRecordsByStock(records);

    this.analyticsTotalItems = records.length;
    this.analyticsLowStockItems = records.filter((inventoryRecord) => {
      const quantity = this.toNumber(inventoryRecord.quantity);
      const reorderLevel = this.toNumber(inventoryRecord.reorderLevel ?? inventoryRecord.reorder_level);
      return reorderLevel > 0 && quantity <= reorderLevel;
    }).length;

    this.analyticsAvailableItems = records.filter((inventoryRecord) => {
      const status = (inventoryRecord.status ?? '').toString().toLowerCase();
      return status === 'available';
    }).length;

    this.analyticsCategoriesCount = new Set(
      records
        .map((inventoryRecord) => (inventoryRecord.category ?? '').toString().trim())
        .filter((category) => category.length > 0)
    ).size;

    this.analyticsPieChartData = this.prepareCategoryPieChartData(filteredChartRecords);
    this.analyticsPieChartBackground = this.buildConicGradientBackground(this.analyticsPieChartData);
    this.analyticsDonutChartData = this.prepareStockDonutChartData(records);
    this.analyticsDonutChartBackground = this.buildConicGradientBackground(this.analyticsDonutChartData);
  }

  private filterAnalyticsRecordsByStock(records: any[]): any[] {
    if (this.analyticsStockFilter === 'ALL') {
      return records;
    }

    return records.filter((inventoryRecord) => {
      const quantity = this.toNumber(inventoryRecord.quantity);
      const reorderLevel = this.toNumber(inventoryRecord.reorderLevel ?? inventoryRecord.reorder_level);

      const isOutOfStock = quantity <= 0;
      const isLowStock = !isOutOfStock && reorderLevel > 0 && quantity <= reorderLevel;
      const isInStock = quantity > reorderLevel && quantity > 0;
      const isNotInStock = isLowStock || isOutOfStock;

      if (this.analyticsStockFilter === 'IN_STOCK') {
        return isInStock;
      }

      if (this.analyticsStockFilter === 'LOW_STOCK') {
        return isLowStock;
      }

      if (this.analyticsStockFilter === 'OUT_OF_STOCK') {
        return isOutOfStock;
      }

      return isNotInStock;
    });
  }

  private prepareCategoryPieChartData(records: any[]): { label: string; value: number; percentage: number; color: string }[] {
    const quantityByCategory = new Map<string, number>();

    records.forEach((inventoryRecord) => {
      const category = (inventoryRecord.category ?? 'Uncategorized').toString().trim() || 'Uncategorized';
      const quantity = this.toNumber(inventoryRecord.quantity);
      const currentTotal = quantityByCategory.get(category) ?? 0;
      quantityByCategory.set(category, currentTotal + quantity);
    });

    const chartData = Array.from(quantityByCategory.entries())
      .map(([category, totalQuantity]) => ({ label: category, value: totalQuantity }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const totalQuantity = chartData.reduce((total, chartItem) => total + chartItem.value, 0);

    return chartData.map((chartItem, index) => ({
      ...chartItem,
      percentage: totalQuantity > 0 ? (chartItem.value / totalQuantity) * 100 : 0,
      color: this.getChartColor(index)
    }));
  }

  private prepareStockDonutChartData(records: any[]): { label: string; value: number; percentage: number; color: string }[] {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    records.forEach((inventoryRecord) => {
      const quantity = this.toNumber(inventoryRecord.quantity);
      const reorderLevel = this.toNumber(inventoryRecord.reorderLevel ?? inventoryRecord.reorder_level);

      if (quantity <= 0) {
        outOfStockCount += 1;
        return;
      }

      if (reorderLevel > 0 && quantity <= reorderLevel) {
        lowStockCount += 1;
        return;
      }

      inStockCount += 1;
    });

    const stockData = [
      { label: 'In Stock', value: inStockCount, color: '#22c55e' },
      { label: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
      { label: 'Out Of Stock', value: outOfStockCount, color: '#ef4444' }
    ];

    const total = stockData.reduce((sum, stockItem) => sum + stockItem.value, 0);
    return stockData.map((stockItem) => ({
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

  private downloadCsvFile(records: any[], fileNamePrefix: string): void {
    if (records.length === 0) {
      return;
    }

    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map((record) =>
        headers
          .map((header) => this.escapeCsvValue(record[header]))
          .join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = globalThis.URL.createObjectURL(csvBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileNamePrefix}-${this.getExportDateLabel()}.csv`;
    anchor.click();
    globalThis.URL.revokeObjectURL(url);
  }

  private escapeCsvValue(value: any): string {
    const normalizedValue = (value ?? '').toString().replace(/"/g, '""');
    return `"${normalizedValue}"`;
  }

  private getExportDateLabel(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}${month}${day}`;
  }

  logout() {
    this.router.navigate(['/']);
  }
}
