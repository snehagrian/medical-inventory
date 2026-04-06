import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { InventoryPageResponse, InventoryQueryParams, InventoryService } from '../services/inventory.services';
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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  items: any[] = [];
  paginatedItems: any[] = [];
  orderItems: any[] = [];

  isLoading = true;
  errorMessage = '';
  isLowStockView = false;
  showReorderModal = false;
  reportDate = new Date();
  printContext: 'none' | 'reorder' = 'none';

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
  displayedColumns = ['id', 'itemName', 'category', 'quantity', 'reorderLevel', 'unitPrice', 'supplierName', 'expiryDate', 'status', 'actions'];

  showFormModal = false;
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;
  isEditMode = false;
  selectedEditId: number | null = null;
  itemForm!: FormGroup;

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
    private readonly inventoryService: InventoryService,
    private readonly cdr: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar,
    private readonly fb: FormBuilder
  ) {
    this.itemForm = this.buildItemForm();
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadCurrentView();
    });

    this.showAllItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  showAllItems(): void {
    this.isLowStockView = false;
    this.currentPage = 1;
    this.loadAllItems();
  }

  showLowStockItems(): void {
    this.isLowStockView = true;
    this.currentPage = 1;
    this.loadLowStockItems();
  }

  calculatePriority(item: any): 'High' | 'Medium' | 'Low' {
    const quantity = toNumber(item?.quantity);
    const reorderLevel = toNumber(item?.reorderLevel);

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
    const quantity = toNumber(item?.quantity);
    const reorderLevel = toNumber(item?.reorderLevel);
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
    if (!this.isLowStockView || this.items.length === 0) {
      return false;
    }

    return this.items.every((inventoryRecord: any) => this.isOrderItemSelected(inventoryRecord));
  }

  toggleOrderSelection(item: any, isSelected: boolean): void {
    if (isSelected) {
      const suggestedOrderQuantity = this.getSuggestedOrderQuantity(item);
      const orderItem = {
        id: item?.id ?? null,
        itemName: item?.itemName ?? item?.item_name ?? '',
        category: item?.category ?? '',
        quantity: toNumber(item?.quantity),
        reorderLevel: toNumber(item?.reorderLevel ?? item?.reorder_level),
        expiryDate: item?.expiryDate ?? item?.expiry_date ?? '',
        supplierName: item?.supplierName ?? item?.supplier_name ?? '',
        unitPrice: toNumber(item?.unitPrice ?? item?.unit_price),
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
    this.items.forEach((inventoryRecord: any) => {
      this.toggleOrderSelection(inventoryRecord, isSelected);
    });
  }

  openReorderModal(item: any): void {
    const suggestedOrderQuantity = this.getSuggestedOrderQuantity(item);

    this.reorderForm = {
      id: item?.id ?? null,
      itemName: item?.itemName ?? item?.item_name ?? '',
      category: item?.category ?? '',
      quantity: toNumber(item?.quantity),
      reorderLevel: toNumber(item?.reorderLevel ?? item?.reorder_level),
      expiryDate: item?.expiryDate ?? item?.expiry_date ?? '',
      supplierName: item?.supplierName ?? item?.supplier_name ?? '',
      unitPrice: toNumber(item?.unitPrice ?? item?.unit_price),
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
    const orderQuantity = Math.max(1, toNumber(this.reorderForm.orderQuantity));
    const suggestedOrderQuantity = Math.max(1, toNumber(this.reorderForm.suggestedOrderQuantity));

    const orderItem = {
      id: this.reorderForm.id,
      itemName: this.reorderForm.itemName,
      category: this.reorderForm.category,
      quantity: toNumber(this.reorderForm.quantity),
      reorderLevel: toNumber(this.reorderForm.reorderLevel),
      expiryDate: this.reorderForm.expiryDate,
      supplierName: this.reorderForm.supplierName,
      unitPrice: toNumber(this.reorderForm.unitPrice),
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

  exportLowStockAsXlsx(): void {
    const rows = this.orderItems.map((orderItem) => ({
      'Item Name': orderItem.itemName ?? '',
      Category: orderItem.category ?? '',
      'Current Quantity': toNumber(orderItem.quantity),
      'Reorder Level': toNumber(orderItem.reorderLevel),
      'Suggested Quantity': toNumber(orderItem.suggestedOrderQuantity),
      'Order Quantity': toNumber(orderItem.orderQuantity),
      'Expiry Date': orderItem.expiryDate ?? '',
      Supplier: orderItem.supplierName ?? '',
      Priority: orderItem.priority ?? ''
    }));
    downloadXlsxFile(rows, 'Low Stock', 'low-stock-order-list');
  }

  getReportDateLabel(): string {
    return this.reportDate.toLocaleDateString();
  }

  onFiltersChanged(): void {
    this.dateRangeError = !!(this.dateFrom && this.dateTo && this.dateFrom > this.dateTo);
    if (this.dateRangeError) {
      return;
    }
    this.currentPage = 1;
    this.loadCurrentView();
  }

  onSortFieldChange(): void {
    if (!this.sortField) {
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadCurrentView();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = Number(pageSize);
    this.currentPage = 1;
    this.loadCurrentView();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadCurrentView();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  saveItem(): void {
    if (this.isEditMode && this.selectedEditId !== null) {
      this.inventoryService.updateItem(this.selectedEditId, this.itemForm.value).subscribe({
        next: () => {
          this.closeForm();
          this.loadCurrentView();
          this.snackBar.open('Item updated successfully.', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.errorMessage = error?.error || 'Failed to update inventory item.';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
          console.error('Error updating inventory item', error);
        }
      });
      return;
    }

    this.inventoryService.addItem(this.itemForm.value).subscribe({
      next: () => {
        this.closeForm();
        this.loadCurrentView();
        this.snackBar.open('Item added successfully.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to add inventory item.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
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
    this.itemForm.patchValue({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      supplierName: item.supplierName,
      expiryDate: item.expiryDate,
      status: item.status
    });
    this.showFormModal = true;
  }

  onEdit(item: any): void {
    this.openEditForm(item);
  }

  onDelete(id: number): void {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.deleteTargetId === null) {
      return;
    }
    this.inventoryService.deleteItem(this.deleteTargetId).subscribe({
      next: () => {
        this.cancelDelete();
        this.loadCurrentView();
        this.snackBar.open('Item deleted successfully.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.errorMessage = error?.error || 'Failed to delete inventory item.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
        console.error('Error deleting inventory item', error);
        this.cancelDelete();
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
  }

  closeForm(): void {
    this.showFormModal = false;
    this.isEditMode = false;
    this.selectedEditId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.itemForm = this.buildItemForm();
  }

  private buildItemForm(): FormGroup {
    return this.fb.group({
      itemName: ['', [Validators.required]],
      category: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      supplierName: ['', [Validators.required]],
      expiryDate: ['', [Validators.required]],
      status: ['AVAILABLE', [Validators.required]]
    });
  }

  private loadAllItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.inventoryService.allItems(this.buildQueryParams()).subscribe({
      next: (response) => {
        if (!this.applyPagedResponse(response)) {
          return;
        }
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
    this.inventoryService.getLowStockItems(this.buildQueryParams()).subscribe({
      next: (response) => {
        if (!this.applyPagedResponse(response)) {
          return;
        }
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

  private loadCurrentView(): void {
    if (this.isLowStockView) {
      this.loadLowStockItems();
      return;
    }
    this.loadAllItems();
  }

  private applyPagedResponse(response: InventoryPageResponse): boolean {
    const responsePage = (response.page ?? 0) + 1;
    const resolvedTotalPages = Math.max(1, response.totalPages ?? 0);

    if ((response.items?.length ?? 0) === 0 && (response.totalElements ?? 0) > 0 && responsePage > resolvedTotalPages) {
      this.currentPage = resolvedTotalPages;
      this.loadCurrentView();
      return false;
    }

    this.items = response.items ?? [];
    this.paginatedItems = [...this.items];
    this.availableCategories = response.availableCategories ?? [];
    this.availableStatuses = response.availableStatuses ?? [];
    this.totalPages = resolvedTotalPages;
    this.currentPage = (response.totalElements ?? 0) === 0 ? 1 : responsePage;

    return true;
  }

  private buildQueryParams(): InventoryQueryParams {
    return {
      page: Math.max(0, this.currentPage - 1),
      size: this.pageSize,
      search: this.searchTerm.trim() || undefined,
      category: this.selectedCategory !== 'ALL' ? this.selectedCategory : undefined,
      status: this.selectedStatus !== 'ALL' ? this.selectedStatus : undefined,
      dateFrom: this.dateFrom ? toIsoDateString(this.dateFrom) : undefined,
      dateTo: this.dateTo ? toIsoDateString(this.dateTo) : undefined,
      sortField: this.sortField || undefined,
      sortDirection: this.sortField ? this.sortDirection : undefined
    };
  }

}
