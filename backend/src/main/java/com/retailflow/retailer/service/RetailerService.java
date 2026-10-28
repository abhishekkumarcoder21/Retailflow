package com.retailflow.retailer.service;

import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.retailer.dto.CreateRetailerRequest;
import com.retailflow.retailer.dto.RetailerDto;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.entity.RetailerAssignment;
import com.retailflow.retailer.repository.RetailerAssignmentRepository;
import com.retailflow.retailer.repository.RetailerRepository;
import com.retailflow.security.UserPrincipal;
import com.retailflow.territory.entity.Territory;
import com.retailflow.territory.repository.TerritoryRepository;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RetailerService {

    private final RetailerRepository retailerRepository;
    private final RetailerAssignmentRepository assignmentRepository;
    private final OrganizationRepository organizationRepository;
    private final TerritoryRepository territoryRepository;
    private final UserRepository userRepository;

    public RetailerService(
            RetailerRepository retailerRepository,
            RetailerAssignmentRepository assignmentRepository,
            OrganizationRepository organizationRepository,
            TerritoryRepository territoryRepository,
            UserRepository userRepository) {
        this.retailerRepository = retailerRepository;
        this.assignmentRepository = assignmentRepository;
        this.organizationRepository = organizationRepository;
        this.territoryRepository = territoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<RetailerDto> getRetailers(
            Long organizationId,
            UserPrincipal principal,
            Long territoryId,
            Retailer.RetailerStatus status,
            String keyword,
            Pageable pageable) {

        Page<Retailer> retailers;
        if (principal.getRole() == User.Role.SALES_REP) {
            retailers = retailerRepository.findAssignedToUserFiltered(
                    organizationId, principal.getId(), territoryId, status, keyword, pageable);
        } else {
            retailers = retailerRepository.findFiltered(
                    organizationId, territoryId, status, keyword, pageable);
        }

        return retailers.map(this::enrichRetailerDto);
    }

    @Transactional(readOnly = true)
    public RetailerDto getRetailerById(Long organizationId, UserPrincipal principal, Long id) {
        Retailer retailer = findRetailerInOrg(organizationId, id);

        if (principal.getRole() == User.Role.SALES_REP) {
            boolean isAssigned = assignmentRepository.existsByRetailerIdAndUserId(id, principal.getId());
            if (!isAssigned) {
                throw new ResourceNotFoundException("Retailer not found or not assigned to you");
            }
        }

        return enrichRetailerDto(retailer);
    }

    @Transactional
    public RetailerDto createRetailer(Long organizationId, CreateRetailerRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Retailer retailer = new Retailer();
        retailer.setOrganization(org);
        retailer.setBusinessName(request.getBusinessName());
        retailer.setOwnerName(request.getOwnerName());
        retailer.setPhone(request.getPhone());
        retailer.setEmail(request.getEmail());
        retailer.setAddress(request.getAddress());
        retailer.setCity(request.getCity());
        retailer.setState(request.getState());
        retailer.setPostalCode(request.getPostalCode());
        retailer.setStatus(request.getStatus() != null ? request.getStatus() : Retailer.RetailerStatus.ACTIVE);

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found: " + request.getTerritoryId()));
            retailer.setTerritory(territory);
        }

        retailer = retailerRepository.save(retailer);

        if (request.getSalesRepIds() != null && !request.getSalesRepIds().isEmpty()) {
            for (Long repId : request.getSalesRepIds()) {
                assignSalesRep(organizationId, retailer.getId(), repId);
            }
        }

        return enrichRetailerDto(retailer);
    }

    @Transactional
    public RetailerDto updateRetailer(Long organizationId, Long id, CreateRetailerRequest request) {
        Retailer retailer = findRetailerInOrg(organizationId, id);

        retailer.setBusinessName(request.getBusinessName());
        retailer.setOwnerName(request.getOwnerName());
        retailer.setPhone(request.getPhone());
        retailer.setEmail(request.getEmail());
        retailer.setAddress(request.getAddress());
        retailer.setCity(request.getCity());
        retailer.setState(request.getState());
        retailer.setPostalCode(request.getPostalCode());
        if (request.getStatus() != null) {
            retailer.setStatus(request.getStatus());
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found: " + request.getTerritoryId()));
            retailer.setTerritory(territory);
        }

        retailer = retailerRepository.save(retailer);

        if (request.getSalesRepIds() != null) {
            assignmentRepository.deleteByRetailerId(id);
            for (Long repId : request.getSalesRepIds()) {
                assignSalesRep(organizationId, retailer.getId(), repId);
            }
        }

        return enrichRetailerDto(retailer);
    }

    @Transactional
    public void assignSalesRep(Long organizationId, Long retailerId, Long userId) {
        Retailer retailer = findRetailerInOrg(organizationId, retailerId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!assignmentRepository.existsByRetailerIdAndUserId(retailerId, userId)) {
            RetailerAssignment assignment = new RetailerAssignment();
            assignment.setRetailer(retailer);
            assignment.setUser(user);
            assignmentRepository.save(assignment);
        }
    }

    @Transactional
    public void unassignSalesRep(Long organizationId, Long retailerId, Long userId) {
        findRetailerInOrg(organizationId, retailerId);
        assignmentRepository.deleteByRetailerIdAndUserId(retailerId, userId);
    }

    @Transactional
    public void deleteRetailer(Long organizationId, Long id) {
        Retailer retailer = findRetailerInOrg(organizationId, id);
        retailer.setStatus(Retailer.RetailerStatus.INACTIVE);
        retailerRepository.save(retailer);
    }

    private Retailer findRetailerInOrg(Long organizationId, Long id) {
        Retailer retailer = retailerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found with id: " + id));
        if (!retailer.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Retailer not found with id: " + id);
        }
        return retailer;
    }

    private RetailerDto enrichRetailerDto(Retailer r) {
        RetailerDto dto = RetailerDto.fromEntity(r);
        List<RetailerAssignment> assignments = assignmentRepository.findByRetailerId(r.getId());
        List<Long> repIds = new ArrayList<>();
        List<String> repNames = new ArrayList<>();

        for (RetailerAssignment a : assignments) {
            repIds.add(a.getUser().getId());
            repNames.add(a.getUser().getFullName());
        }

        dto.setAssignedSalesRepIds(repIds);
        dto.setAssignedSalesRepNames(repNames);
        return dto;
    }
}
