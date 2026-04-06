package com.medicalinventory.backend.controller;

import com.medicalinventory.backend.dto.InventoryItemPageResponse;
import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryReportSummaryResponse;
import com.medicalinventory.backend.service.InventoryItemService;
import com.medicalinventory.backend.service.InventoryReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/inventory")
public class InventoryReportController {

    @Autowired
    private InventoryItemService inventoryItemService;

    @Autowired
    private InventoryReportService inventoryReportService;

    @GetMapping
    public InventoryItemPageResponse getInventoryReport(
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

    @GetMapping("/summary")
    public InventoryReportSummaryResponse getInventoryReportSummary(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) {
        return inventoryReportService.getInventoryReportSummary(new InventoryItemQuery(
                0, 10, search, category, status, dateFrom, dateTo, null, null, true
        ));
    }
}
