import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventoryQueryParams {
	page?: number;
	size?: number;
	search?: string;
	category?: string;
	status?: string;
	dateFrom?: string;
	dateTo?: string;
	sortField?: string;
	sortDirection?: string;
	all?: boolean;
}

export interface InventoryPageResponse {
	items: any[];
	totalElements: number;
	totalPages: number;
	page: number;
	size: number;
	availableCategories: string[];
	availableStatuses: string[];
}

export interface InventoryReportBreakdown {
	label: string;
	value: number;
}

export interface InventoryReportSummaryResponse {
	totalItems: number;
	lowStockItems: number;
	availableItems: number;
	categoriesCount: number;
	totalInventoryValue: number;
	quantityByCategory: InventoryReportBreakdown[];
	stockHealth: InventoryReportBreakdown[];
}

@Injectable({
	providedIn: 'root'
})
export class InventoryService {
	private readonly baseUrl = 'http://localhost:8080/api/items';
	private readonly reportBaseUrl = 'http://localhost:8080/api/reports/inventory';

	constructor(private readonly http: HttpClient) {}

	allItems(params: InventoryQueryParams = {}): Observable<InventoryPageResponse> {
		return this.http.get<InventoryPageResponse>(this.baseUrl, {
			params: this.toHttpParams(params)
		});
	}

	getLowStockItems(params: InventoryQueryParams = {}): Observable<InventoryPageResponse> {
		return this.http.get<InventoryPageResponse>(`${this.baseUrl}/low-stock`, {
			params: this.toHttpParams(params)
		});
	}

	getInventoryReport(params: InventoryQueryParams = {}): Observable<InventoryPageResponse> {
		return this.http.get<InventoryPageResponse>(this.reportBaseUrl, {
			params: this.toHttpParams(params)
		});
	}

	getInventoryReportSummary(params: InventoryQueryParams = {}): Observable<InventoryReportSummaryResponse> {
		return this.http.get<InventoryReportSummaryResponse>(`${this.reportBaseUrl}/summary`, {
			params: this.toHttpParams({
				search: params.search,
				category: params.category,
				status: params.status,
				dateFrom: params.dateFrom,
				dateTo: params.dateTo
			})
		});
	}

	addItem(item: any): Observable<any> {
		return this.http.post<any>(this.baseUrl, item);
	}

	updateItem(id: number, item: any): Observable<any> {
		return this.http.put<any>(`${this.baseUrl}/${id}`, item);
	}

	deleteItem(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	private toHttpParams(params: InventoryQueryParams): HttpParams {
		let httpParams = new HttpParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') {
				return;
			}

			httpParams = httpParams.set(key, String(value));
		});

		return httpParams;
	}
}
