package com.medicalinventory.backend.service;

import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryReportBreakdown;
import com.medicalinventory.backend.dto.InventoryReportSummaryProjection;
import com.medicalinventory.backend.dto.InventoryReportSummaryResponse;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryReportServiceTest {

    private static final InventoryItemQuery DEFAULT_QUERY = new InventoryItemQuery(
            0, 10, null, null, null, null, null, null, null, false
    );

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private InventoryReportService inventoryReportService;

    @Test
    void getInventoryReportSummary_buildsAggregateResponse() {
        InventoryReportSummaryProjection projection = new InventoryReportSummaryProjection() {
            @Override
            public Long getTotalItems() {
                return 12L;
            }

            @Override
            public Long getLowStockItems() {
                return 3L;
            }

            @Override
            public Long getAvailableItems() {
                return 8L;
            }

            @Override
            public Long getCategoriesCount() {
                return 4L;
            }

            @Override
            public Double getTotalInventoryValue() {
                return 24500.0;
            }

            @Override
            public Long getOutOfStockItems() {
                return 2L;
            }
        };

        when(inventoryItemRepository.getInventoryReportSummary(null, null, null, null, null)).thenReturn(projection);
        when(inventoryItemRepository.getInventoryQuantityByCategory(null, null, null, null, null)).thenReturn(
                List.of(
                        new InventoryReportBreakdown("Fixation", 40),
                        new InventoryReportBreakdown("Fusion", 12)
                )
        );

        InventoryReportSummaryResponse result = inventoryReportService.getInventoryReportSummary(DEFAULT_QUERY);

        assertEquals(12, result.totalItems());
        assertEquals(3, result.lowStockItems());
        assertEquals(8, result.availableItems());
        assertEquals(4, result.categoriesCount());
        assertEquals(24500.0, result.totalInventoryValue());
        assertEquals(2, result.quantityByCategory().size());
        assertEquals("In Stock", result.stockHealth().get(0).label());
        assertEquals(7, result.stockHealth().get(0).value());
        assertEquals("Out Of Stock", result.stockHealth().get(2).label());
        assertEquals(2, result.stockHealth().get(2).value());
    }

    @Test
    void getInventoryReportSummary_throws400WhenDateFilterIsInvalid() {
        InventoryItemQuery invalidDateQuery = new InventoryItemQuery(
                0, 10, null, null, null, "04/01/2026", null, null, null, true
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> inventoryReportService.getInventoryReportSummary(invalidDateQuery)
        );

        assertEquals(400, ex.getStatusCode().value());
    }
}
