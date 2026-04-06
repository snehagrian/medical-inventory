package com.medicalinventory.backend.controller;

import com.medicalinventory.backend.dto.InventoryItemPageResponse;
import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryItemRequest;
import com.medicalinventory.backend.dto.InventoryItemResponse;
import com.medicalinventory.backend.service.InventoryItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/items")
public class InventoryItemController {

    @Autowired
    private InventoryItemService inventoryItemService;

    @GetMapping
    public InventoryItemPageResponse getAllItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String sortField,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(defaultValue = "false") boolean all
    ) {
        return inventoryItemService.getAllItems(new InventoryItemQuery(
                page, size, search, category, status, dateFrom, dateTo, sortField, sortDirection, all
        ));
    }

    @GetMapping("/low-stock")
    public InventoryItemPageResponse getLowStockItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String sortField,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(defaultValue = "false") boolean all
    ) {
        return inventoryItemService.getLowStockItems(new InventoryItemQuery(
                page, size, search, category, status, dateFrom, dateTo, sortField, sortDirection, all
        ));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemResponse addItem(@Valid @RequestBody InventoryItemRequest request) {
        return inventoryItemService.addItem(request);
    }

    @PutMapping("/{id}")
    public InventoryItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody InventoryItemRequest request) {
        return inventoryItemService.updateItem(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        inventoryItemService.deleteItem(id);
    }
}
