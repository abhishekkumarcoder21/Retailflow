package com.retailflow.recommendation.service;

import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.inventory.entity.Inventory;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.recommendation.dto.RecommendationDto;
import com.retailflow.recommendation.entity.Recommendation;
import com.retailflow.recommendation.repository.RecommendationRepository;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.repository.RetailerRepository;
import com.retailflow.visit.entity.Visit;
import com.retailflow.visit.repository.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final InventoryRepository inventoryRepository;
    private final RetailerRepository retailerRepository;
    private final VisitRepository visitRepository;
    private final OrganizationRepository organizationRepository;

    public RecommendationService(
            RecommendationRepository recommendationRepository,
            InventoryRepository inventoryRepository,
            RetailerRepository retailerRepository,
            VisitRepository visitRepository,
            OrganizationRepository organizationRepository) {
        this.recommendationRepository = recommendationRepository;
        this.inventoryRepository = inventoryRepository;
        this.retailerRepository = retailerRepository;
        this.visitRepository = visitRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional
    public List<RecommendationDto> getActiveRecommendations(Long organizationId) {
        // Auto-refresh recommendations from current database state if none exist
        List<Recommendation> existing = recommendationRepository
                .findByOrganizationIdAndStatus(organizationId, Recommendation.Status.ACTIVE);

        if (existing.isEmpty()) {
            refreshRecommendations(organizationId);
            existing = recommendationRepository
                    .findByOrganizationIdAndStatus(organizationId, Recommendation.Status.ACTIVE);
        }

        return existing.stream()
                .map(RecommendationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void refreshRecommendations(Long organizationId) {
        Organization org = organizationRepository.findById(organizationId).orElse(null);
        if (org == null) return;

        List<Recommendation> newRecs = new ArrayList<>();

        // Rule 1: Low stock alert
        List<Inventory> lowStockItems = inventoryRepository.findLowStock(organizationId);
        for (Inventory inv : lowStockItems) {
            Recommendation rec = new Recommendation();
            rec.setOrganization(org);
            rec.setType(Recommendation.RecommendationType.LOW_STOCK);
            rec.setTitle("Critical Low Stock: " + inv.getProduct().getName());
            rec.setDescription(String.format(
                    "Product '%s' (SKU: %s) has only %d units remaining, which is below the safe threshold of %d.",
                    inv.getProduct().getName(), inv.getProduct().getSku(), inv.getQuantity(), inv.getLowStockThreshold()));
            rec.setEntityType("PRODUCT");
            rec.setEntityId(inv.getProduct().getId());
            rec.setPriority(inv.getQuantity() == 0 ? Recommendation.Priority.CRITICAL : Recommendation.Priority.HIGH);
            rec.setStatus(Recommendation.Status.ACTIVE);
            rec.setSuggestedAction("Issue stock replenishment order to prevent fulfillment disruptions.");
            newRecs.add(rec);
        }

        // Rule 2: Unvisited retailers (> 14 days)
        List<Retailer> retailers = retailerRepository.findByOrganizationIdAndStatus(organizationId, Retailer.RetailerStatus.ACTIVE);
        for (Retailer r : retailers) {
            Optional<Visit> lastVisit = visitRepository.findTopByOrganizationIdAndRetailerIdOrderByCheckInTimeDesc(
                    organizationId, r.getId());

            boolean needsVisit = lastVisit.isEmpty() ||
                    (lastVisit.get().getCheckInTime() != null &&
                     lastVisit.get().getCheckInTime().isBefore(LocalDateTime.now().minusDays(14)));

            if (needsVisit) {
                Recommendation rec = new Recommendation();
                rec.setOrganization(org);
                rec.setType(Recommendation.RecommendationType.UNVISITED_RETAILER);
                rec.setTitle("Retailer Visit Due: " + r.getBusinessName());
                rec.setDescription(String.format(
                        "Store '%s' in %s has not had an in-person representative visit in over 14 days.",
                        r.getBusinessName(), r.getCity() != null ? r.getCity() : "assigned territory"));
                rec.setEntityType("RETAILER");
                rec.setEntityId(r.getId());
                rec.setPriority(Recommendation.Priority.MEDIUM);
                rec.setStatus(Recommendation.Status.ACTIVE);
                rec.setSuggestedAction("Schedule an on-site visit to inspect shelf stock and verify relationships.");
                newRecs.add(rec);
            }
        }

        recommendationRepository.saveAll(newRecs);
    }

    @Transactional
    public RecommendationDto dismissRecommendation(Long organizationId, Long id) {
        Recommendation rec = findRecommendationInOrg(organizationId, id);
        rec.setStatus(Recommendation.Status.DISMISSED);
        rec = recommendationRepository.save(rec);
        return RecommendationDto.fromEntity(rec);
    }

    @Transactional
    public RecommendationDto completeRecommendation(Long organizationId, Long id) {
        Recommendation rec = findRecommendationInOrg(organizationId, id);
        rec.setStatus(Recommendation.Status.COMPLETED);
        rec = recommendationRepository.save(rec);
        return RecommendationDto.fromEntity(rec);
    }

    private Recommendation findRecommendationInOrg(Long organizationId, Long id) {
        Recommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found with id: " + id));
        if (!rec.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Recommendation not found with id: " + id);
        }
        return rec;
    }
}
