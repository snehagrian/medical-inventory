import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class InventoryService {
	private readonly baseUrl = 'http://localhost:8080/api/items';

	constructor(private readonly http: HttpClient) {}

	allItems(): Observable<any[]> {
		return this.http.get<any[]>(this.baseUrl);
	}

	getLowStockItems(): Observable<any[]> {
		return this.http.get<any[]>(`${this.baseUrl}/low-stock`);
	}

	addItem(item: any): Observable<any> {
		return this.http.post<any>(this.baseUrl, item);
	}

	updateItem(id: number, item: any): Observable<any> {
		return this.http.put<any>(`${this.baseUrl}/${id}`, item);
	}

	deleteItem(id: number): Observable<string> {
		return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
	}
}
