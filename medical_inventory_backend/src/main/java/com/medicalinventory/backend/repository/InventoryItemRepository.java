package com.medicalinventory.backend.repository;

import com.medicalinventory.backend.dto.InventoryReportBreakdown;
import com.medicalinventory.backend.dto.InventoryReportSummaryProjection;
import com.medicalinventory.backend.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long>, JpaSpecificationExecutor<InventoryItem> {
    boolean existsByItemName(String itemName);
    boolean existsByItemNameAndIdNot(String itemName, Long id);

    @Query("""
            select
              count(i) as totalItems,
              coalesce(sum(case when i.quantity > 0 and i.quantity < i.reorderLevel then 1 else 0 end), 0) as lowStockItems,
              coalesce(sum(case when lower(i.status) = 'available' then 1 else 0 end), 0) as availableItems,
              count(distinct i.category) as categoriesCount,
              coalesce(sum(i.quantity * i.unitPrice), 0) as totalInventoryValue,
              coalesce(sum(case when i.quantity <= 0 then 1 else 0 end), 0) as outOfStockItems
            from InventoryItem i
            where (:search is null
              or lower(i.itemName) like lower(concat('%', :search, '%'))
              or lower(i.category) like lower(concat('%', :search, '%'))
              or lower(i.supplierName) like lower(concat('%', :search, '%')))
              and (:category is null or i.category = :category)
              and (:status is null or i.status = :status)
              and (:dateFrom is null or i.expiryDate >= :dateFrom)
              and (:dateTo is null or i.expiryDate <= :dateTo)
            """)
    InventoryReportSummaryProjection getInventoryReportSummary(
            @Param("search") String search,
            @Param("category") String category,
            @Param("status") String status,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );

    @Query("""
            select new com.medicalinventory.backend.dto.InventoryReportBreakdown(i.category, sum(i.quantity))
            from InventoryItem i
            where (:search is null
              or lower(i.itemName) like lower(concat('%', :search, '%'))
              or lower(i.category) like lower(concat('%', :search, '%'))
              or lower(i.supplierName) like lower(concat('%', :search, '%')))
              and (:category is null or i.category = :category)
              and (:status is null or i.status = :status)
              and (:dateFrom is null or i.expiryDate >= :dateFrom)
              and (:dateTo is null or i.expiryDate <= :dateTo)
            group by i.category
            order by i.category asc
            """)
    List<InventoryReportBreakdown> getInventoryQuantityByCategory(
            @Param("search") String search,
            @Param("category") String category,
            @Param("status") String status,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );
}
