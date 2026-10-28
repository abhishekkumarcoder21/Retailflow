package com.retailflow.organization.service;

import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.dto.OrganizationDto;
import com.retailflow.organization.dto.UpdateOrganizationRequest;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public OrganizationDto getCurrentOrganization(Long organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return OrganizationDto.fromEntity(org);
    }

    @Transactional
    public OrganizationDto updateCurrentOrganization(Long organizationId, UpdateOrganizationRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (request.getName() != null) org.setName(request.getName());
        if (request.getBusinessType() != null) org.setBusinessType(request.getBusinessType());
        if (request.getAddress() != null) org.setAddress(request.getAddress());
        if (request.getPhone() != null) org.setPhone(request.getPhone());
        if (request.getEmail() != null) org.setEmail(request.getEmail());

        org = organizationRepository.save(org);
        return OrganizationDto.fromEntity(org);
    }
}
