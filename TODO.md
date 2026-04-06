# TODO — Compliance Gaps

Items to fix before writing documentation. Ordered by priority.

---

## P1 — Must Fix (Functionality 25% of grade)

- [x] **Debounce search input (300ms)**
  - `dashboard.ts` — `Subject` + `debounceTime(300)` + `distinctUntilChanged` pipeline in `ngOnInit`
  - `dashboard.html` — search input now uses `[ngModel]` + `(ngModelChange)="onSearchChange($event)"`

- [x] **Date range filter on report view**
  - `app.config.ts` — `provideNativeDateAdapter()` added
  - `dashboard.ts` — `MatDatepickerModule` imported; `dateFrom`/`dateTo` typed as `Date | null`, defaulting to first/last day of current month; `toIsoDateString()` helper; `onFiltersChanged` validates from ≤ to and sets `dateRangeError`
  - `dashboard.html` — proper `mat-datepicker` with toggle, `[max]`/`[min]` binding, and `mat-error` on invalid range

- [x] **Export to .xlsx instead of CSV**
  - `package.json` — SheetJS (`xlsx`) installed
  - `dashboard.ts` — `downloadXlsxFile()` replaces `downloadCsvFile()`; export methods renamed to `exportAllItemsAsXlsx` / `exportLowStockAsXlsx`
  - `dashboard.html` — export buttons updated

- [x] **DTO pattern in backend controller**
  - New: `dto/InventoryItemRequest.java`, `dto/InventoryItemResponse.java`
  - `InventoryItemService.java` — all methods use request/response DTOs; `toEntity()` helper maps request to entity
  - `InventoryItemController.java` — accepts `InventoryItemRequest`, returns `InventoryItemResponse`; `@Valid` added
  - Tests updated: `InventoryItemServiceTest.java`, `InventoryItemControllerTest.java`, `JwtAuthenticationIntegrationTest.java`
  - 18/18 backend tests passing

---

## P2 — Nice to Have (do only if time allows)

- [x] **Proper HTTP status codes on DELETE**
  - Done alongside DTO work — DELETE now returns `204 No Content`

- [x] **Unique constraint on `item_name`**
  - `InventoryItem.java` — `unique = true` on `item_name` column
  - `InventoryItemRepository.java` — `existsByItemName` and `existsByItemNameAndIdNot` query methods
  - `InventoryItemService.java` — `409 CONFLICT` on duplicate name in both `addItem` and `updateItem`
  - `InventoryItemServiceTest.java` — 2 new tests covering duplicate add and duplicate update

---

## P3 — Compliance Gaps (found on final review)

- [x] **Submit button disabled until form valid (UC-LOGIN-02)**
  - `login.html` — `[disabled]="loginForm.invalid"` added to submit button

- [x] **Success/error toast notifications on CRUD (UC-TXN-02, UC-TXN-04)**
  - `dashboard.ts` — `MatSnackBar` injected; `snackBar.open(...)` called on success and error in `saveItem()` and `confirmDelete()`

- [x] **Add/Edit form refactored to Reactive Forms (Transaction tech requirement)**
  - `dashboard.ts` — `itemForm` is now a `FormGroup` built with `FormBuilder`; `Validators.required` / `Validators.min` on all fields
  - `dashboard.html` — `[formGroup]="itemForm"` + `formControlName` + `mat-error` per field; submit button `[disabled]="itemForm.invalid"`

- [x] **Replaced custom HTML table with `mat-table` (Transaction tech requirement)**
  - `dashboard.ts` — `MatTableModule` imported; `displayedColumns` array defined
  - `dashboard.html` — inventory view now uses `<mat-table>` with `<mat-header-row>` / `<mat-row>`
  - `dashboard.css` — `.inventory-mat-table` and `.clickable-row` styles added

- [x] **Click row to open edit dialog (UC-TXN-03)**
  - `dashboard.html` — `mat-row` has `(click)="onEdit(row)"`; edit/delete buttons use `$event.stopPropagation()`
  - `dashboard.css` — `.clickable-row { cursor: pointer }` added

- [x] **Session timeout 30 min with warning (UC-LOGIN-04)**
  - New: `inactivity.service.ts` — tracks mouse/keyboard/scroll; warning at 25 min, logout at 30 min; `showWarning$`, `tick$`, `sessionExpired$` observables
  - `dashboard.ts` — starts service on init, stops on destroy; subscribes to all three streams; `stayLoggedIn()` method
  - `dashboard.html` — inactivity warning modal with live countdown and Stay Logged In / Logout Now buttons
  - `dashboard.css` — `.inactivity-modal-panel` with amber top border

- [x] **JWT secret fix — `Decoders.BASE64.decode` → `getBytes(UTF_8)`**
  - `JwtService.java` — secret was plain text containing `-`, which broke base64 decoding in tests; switched to `jwtSecret.getBytes(StandardCharsets.UTF_8)`
  - All 20 backend tests now passing

---

## Out of Scope (do not implement)

- Remember Me / token refresh — doc marks as "Optional"
- Server-side pagination — client-side pagination meets functional needs
- NgRx, SSR, microservices, OAuth2/SAML, MFA — explicitly out of scope in assessment
