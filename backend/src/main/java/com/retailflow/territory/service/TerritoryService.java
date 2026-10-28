package com.retailflow.territory.service;

import com.retailflow.common.exception.ConflictException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.territory.dto.CreateTerritoryRequest;
import com.retailflow.territory.dto.TerritoryDto;
import com.retailflow.territory.entity.Territory;
import com.retailflow.territory.repository.TerritoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TerritoryService {

    private final TerritoryRepository territoryRepository;
    private final OrganizationRepository organizationRepository;

    public TerritoryService(TerritoryRepository territoryRepository, OrganizationRepository organizationRepository) {
        this.territoryRepository = territoryRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public Page<TerritoryDto> getTerritories(Long organizationId, Pageable pageable) {
        return territoryRepository.findByOrganizationId(organizationId, pageable)
                .map(TerritoryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<TerritoryDto> getActiveTerritories(Long organizationId) {
        return territoryRepository.findByOrganizationIdAndStatus(organizationId, Territory.TerritoryStatus.ACTIVE)
                .stream()
                .map(TerritoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TerritoryDto getTerritoryById(Long organizationId, Long id) {
        return TerritoryDto.fromEntity(findTerritoryInOrg(organizationId, id));
    }

    @Transactional
    public TerritoryDto createTerritory(Long organizationId, CreateTerritoryRequest request) {
        if (territoryRepository.existsByOrganizationIdAndName(organizationId, request.getName())) {
            throw new ConflictException("Territory already exists with name: " + request.getName());
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Territory territory = new Territory();
        territory.setOrganization(org);
        territory.setName(request.getName());
        territory.setDescription(request.getDescription());
        territory.setRegion(request.getRegion());
        territory.setStatus(request.getStatus() != null ? request.getStatus() : Territory.TerritoryStatus.ACTIVE);

        territory = territoryRepository.save(territory);
        return TerritoryDto.fromEntity(territory);
    }

    @Transactional
    public TerritoryDto updateTerritory(Long organizationId, Long id, CreateTerritoryRequest request) {
        Territory territory = findTerritoryInOrg(organizationId, id);

        if (!territory.getName().equalsIgnoreCase(request.getName()) &&
                territoryRepository.existsByOrganizationIdAndName(organizationId, request.getName())) {
            throw new ConflictException("Territory already exists with name: " + request.getName());
        }

        territory.setName(request.getName());
        territory.setDescription(request.getDescription());
        territory.setRegion(request.getRegion());
        if (request.getStatus() != null) {
            territory.setStatus(request.getStatus());
        }

        territory = territoryRepository.save(territory);
        return TerritoryDto.fromEntity(territory);
    }

    @Transactional
    public void deleteTerritory(Long organizationId, Long id) {
        Territory territory = findTerritoryInOrg(organizationId, id);
        territory.setStatus(Territory.TerritoryStatus.INACTIVE);
        territoryRepository.save(territory);
    }

    private Territory findTerritoryInOrg(Long organizationId, Long id) {
        Territory territory = territoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Territory not found with id: " + id));
        if (!territory.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Territory not found with id: " + id);
        }
        return territory;
    }
}
