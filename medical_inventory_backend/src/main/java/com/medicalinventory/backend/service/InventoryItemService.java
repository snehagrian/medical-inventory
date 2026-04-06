package com.medicalinventory.backend.service;

import com.medicalinventory.backend.dto.InventoryItemPageResponse;
import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryItemRequest;
import com.medicalinventory.backend.dto.InventoryItemResponse;
import com.medicalinventory.backend.entity.InventoryItem;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

@Service
public class InventoryItemService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public InventoryItemResponse addItem(InventoryItemRequest request) {
        if (inventoryItemRepository.existsByItemName(request.itemName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item name already exists");
        }
        return InventoryItemResponse.from(inventoryItemRepository.save(toEntity(request)));
    }

    public InventoryItemPageResponse getAllItems(InventoryItemQuery query) {
        return queryItems(query, false);
    }

    public InventoryItemResponse updateItem(Long id, InventoryItemRequest request) {
        InventoryItem existing = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (inventoryItemRepository.existsByItemNameAndIdNot(request.itemName(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item name already exists");
        }

        existing.setItemName(request.itemName());
        existing.setCategory(request.category());
        existing.setQuantity(request.quantity());
        existing.setReorderLevel(request.reorderLevel());
        existing.setUnitPrice(request.unitPrice());
        existing.setSupplierName(request.supplierName());
        existing.setExpiryDate(parseExpiryDate(request.expiryDate()));
        existing.setStatus(request.status());

        return InventoryItemResponse.from(inventoryItemRepository.save(existing));
    }

    public void deleteItem(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found");
        }
        inventoryItemRepository.deleteById(id);
    }

    public InventoryItemPageResponse getLowStockItems(InventoryItemQuery query) {
        return queryItems(query, true);
    }

    private InventoryItem toEntity(InventoryItemRequest request) {
        InventoryItem item = new InventoryItem();
        item.setItemName(request.itemName());
        item.setCategory(request.category());
        item.setQuantity(request.quantity());
        item.setReorderLevel(request.reorderLevel());
        item.setUnitPrice(request.unitPrice());
        item.setSupplierName(request.supplierName());
        item.setExpiryDate(parseExpiryDate(request.expiryDate()));
        item.setStatus(request.status());
        return item;
    }

    private LocalDate parseExpiryDate(String expiryDate) {
        try {
            return LocalDate.parse(expiryDate);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date must use yyyy-MM-dd");
        }
    }

    private InventoryItemPageResponse queryItems(InventoryItemQuery query, boolean lowStockOnly) {
        Specification<InventoryItem> specification = buildSpecification(query, lowStockOnly);
        Sort sort = buildSort(query.sortField(), query.sortDirection());
        List<InventoryItem> matchingItems = inventoryItemRepository.findAll(specification, sort);

        List<String> availableCategories = matchingItems.stream()
                .map(InventoryItem::getCategory)
                .filter(this::hasText)
                .distinct()
                .sorted()
                .toList();

        List<String> availableStatuses = matchingItems.stream()
                .map(InventoryItem::getStatus)
                .filter(this::hasText)
                .distinct()
                .sorted()
                .toList();

        if (query.all()) {
            List<InventoryItemResponse> allItems = matchingItems.stream()
                    .map(InventoryItemResponse::from)
                    .toList();

            return new InventoryItemPageResponse(
                    allItems,
                    allItems.size(),
                    allItems.isEmpty() ? 0 : 1,
                    0,
                    allItems.size(),
                    availableCategories,
                    availableStatuses
            );
        }

        int pageNumber = Math.max(0, query.page());
        int pageSize = Math.max(1, query.size());
        Page<InventoryItem> page = inventoryItemRepository.findAll(specification, PageRequest.of(pageNumber, pageSize, sort));

        List<InventoryItemResponse> pagedItems = page.getContent().stream()
                .map(InventoryItemResponse::from)
                .toList();

        return new InventoryItemPageResponse(
                pagedItems,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize(),
                availableCategories,
                availableStatuses
        );
    }

    private Specification<InventoryItem> buildSpecification(InventoryItemQuery query, boolean lowStockOnly) {
        Specification<InventoryItem> specification = Specification.where(null);

        if (hasText(query.search())) {
            String normalizedSearch = "%" + query.search().trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, ignoredQuery, cb) -> cb.or(
                    cb.like(cb.lower(root.get("itemName")), normalizedSearch),
                    cb.like(cb.lower(root.get("category")), normalizedSearch),
                    cb.like(cb.lower(root.get("supplierName")), normalizedSearch)
            ));
        }

        if (hasText(query.category())) {
            specification = specification.and((root, ignoredQuery, cb) -> cb.equal(root.get("category"), query.category().trim()));
        }

        if (hasText(query.status())) {
            specification = specification.and((root, ignoredQuery, cb) -> cb.equal(root.get("status"), query.status().trim()));
        }

        if (hasText(query.dateFrom())) {
            LocalDate from = parseFilterDate(query.dateFrom(), "dateFrom");
            specification = specification.and((root, ignoredQuery, cb) -> cb.greaterThanOrEqualTo(root.get("expiryDate"), from));
        }

        if (hasText(query.dateTo())) {
            LocalDate to = parseFilterDate(query.dateTo(), "dateTo");
            specification = specification.and((root, ignoredQuery, cb) -> cb.lessThanOrEqualTo(root.get("expiryDate"), to));
        }

        if (lowStockOnly) {
            specification = specification.and((root, ignoredQuery, cb) -> cb.lt(root.get("quantity"), root.get("reorderLevel")));
        }

        return specification;
    }

    private Sort buildSort(String sortField, String sortDirection) {
        String mappedField = switch (sortField == null ? "" : sortField.trim()) {
            case "quantity" -> "quantity";
            case "unitPrice" -> "unitPrice";
            case "expiryDate" -> "expiryDate";
            default -> "id";
        };

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return Sort.by(direction, mappedField);
    }

    private LocalDate parseFilterDate(String value, String parameterName) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, parameterName + " must use yyyy-MM-dd");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank() && !"ALL".equalsIgnoreCase(value.trim());
    }
}
