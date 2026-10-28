package com.retailflow.visit.service;

import com.retailflow.common.exception.ForbiddenException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.repository.RetailerAssignmentRepository;
import com.retailflow.retailer.repository.RetailerRepository;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import com.retailflow.visit.dto.CheckInRequest;
import com.retailflow.visit.dto.CompleteVisitRequest;
import com.retailflow.visit.dto.VisitDto;
import com.retailflow.visit.entity.Visit;
import com.retailflow.visit.repository.VisitRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class VisitService {

    private final VisitRepository visitRepository;
    private final RetailerRepository retailerRepository;
    private final RetailerAssignmentRepository assignmentRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public VisitService(
            VisitRepository visitRepository,
            RetailerRepository retailerRepository,
            RetailerAssignmentRepository assignmentRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository) {
        this.visitRepository = visitRepository;
        this.retailerRepository = retailerRepository;
        this.assignmentRepository = assignmentRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<VisitDto> getVisits(
            Long organizationId,
            UserPrincipal principal,
            Long retailerId,
            Visit.VisitStatus status,
            Pageable pageable) {

        Long targetUserId = (principal.getRole() == User.Role.SALES_REP) ? principal.getId() : null;
        return visitRepository.findFiltered(organizationId, targetUserId, retailerId, status, pageable)
                .map(VisitDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public VisitDto getVisitById(Long organizationId, UserPrincipal principal, Long id) {
        Visit visit = findVisitInOrg(organizationId, id);
        if (principal.getRole() == User.Role.SALES_REP && !visit.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("Access denied to visit record");
        }
        return VisitDto.fromEntity(visit);
    }

    @Transactional
    public VisitDto checkIn(Long organizationId, UserPrincipal principal, CheckInRequest request) {
        Retailer retailer = retailerRepository.findById(request.getRetailerId())
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found: " + request.getRetailerId()));
        if (!retailer.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Retailer not found: " + request.getRetailerId());
        }

        if (principal.getRole() == User.Role.SALES_REP) {
            boolean assigned = assignmentRepository.existsByRetailerIdAndUserId(retailer.getId(), principal.getId());
            if (!assigned) {
                throw new ForbiddenException("You are not assigned to visit retailer: " + retailer.getBusinessName());
            }
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Visit visit = new Visit();
        visit.setOrganization(org);
        visit.setRetailer(retailer);
        visit.setUser(user);
        visit.setStatus(Visit.VisitStatus.CHECKED_IN);
        visit.setCheckInTime(LocalDateTime.now());
        visit.setLatitude(request.getLatitude());
        visit.setLongitude(request.getLongitude());
        visit.setNotes(request.getNotes());

        visit = visitRepository.save(visit);
        return VisitDto.fromEntity(visit);
    }

    @Transactional
    public VisitDto completeVisit(Long organizationId, UserPrincipal principal, Long id, CompleteVisitRequest request) {
        Visit visit = findVisitInOrg(organizationId, id);

        if (principal.getRole() == User.Role.SALES_REP && !visit.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot complete another representative's visit");
        }

        visit.setStatus(Visit.VisitStatus.COMPLETED);
        visit.setCheckOutTime(LocalDateTime.now());
        visit.setOutcome(request.getOutcome());
        if (request.getNotes() != null) {
            String combinedNotes = visit.getNotes() != null ?
                    visit.getNotes() + "\nCheckout notes: " + request.getNotes() : request.getNotes();
            visit.setNotes(combinedNotes);
        }

        visit = visitRepository.save(visit);
        return VisitDto.fromEntity(visit);
    }

    @Transactional
    public VisitDto cancelVisit(Long organizationId, UserPrincipal principal, Long id) {
        Visit visit = findVisitInOrg(organizationId, id);
        if (principal.getRole() == User.Role.SALES_REP && !visit.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("You cannot cancel another representative's visit");
        }
        visit.setStatus(Visit.VisitStatus.CANCELLED);
        visit = visitRepository.save(visit);
        return VisitDto.fromEntity(visit);
    }

    private Visit findVisitInOrg(Long organizationId, Long id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found with id: " + id));
        if (!visit.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Visit not found with id: " + id);
        }
        return visit;
    }
}
