package com.retailflow.distributor.service;

import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.distributor.dto.CreateDistributorRequest;
import com.retailflow.distributor.dto.DistributorDto;
import com.retailflow.distributor.entity.Distributor;
import com.retailflow.distributor.repository.DistributorRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.territory.entity.Territory;
import com.retailflow.territory.repository.TerritoryRepository;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistributorService {

    private final DistributorRepository distributorRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final TerritoryRepository territoryRepository;

    public DistributorService(
            DistributorRepository distributorRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            TerritoryRepository territoryRepository) {
        this.distributorRepository = distributorRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.territoryRepository = territoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<DistributorDto> getDistributors(Long organizationId, Pageable pageable) {
        return distributorRepository.findByOrganizationId(organizationId, pageable)
                .map(DistributorDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DistributorDto> getActiveDistributors(Long organizationId) {
        return distributorRepository.findByOrganizationIdAndStatus(organizationId, Distributor.DistributorStatus.ACTIVE)
                .stream()
                .map(DistributorDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DistributorDto getDistributorById(Long organizationId, Long id) {
        return DistributorDto.fromEntity(findDistributorInOrg(organizationId, id));
    }

    @Transactional(readOnly = true)
    public DistributorDto getDistributorByUserId(Long organizationId, Long userId) {
        Distributor d = distributorRepository.findByOrganizationIdAndUserId(organizationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Distributor not found for user: " + userId));
        return DistributorDto.fromEntity(d);
    }

    @Transactional
    public DistributorDto createDistributor(Long organizationId, CreateDistributorRequest request) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Distributor distributor = new Distributor();
        distributor.setOrganization(org);
        distributor.setName(request.getName());
        distributor.setContactPerson(request.getContactPerson());
        distributor.setPhone(request.getPhone());
        distributor.setEmail(request.getEmail());
        distributor.setAddress(request.getAddress());
        distributor.setStatus(request.getStatus() != null ? request.getStatus() : Distributor.DistributorStatus.ACTIVE);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
            distributor.setUser(user);
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found with id: " + request.getTerritoryId()));
            distributor.setTerritory(territory);
        }

        distributor = distributorRepository.save(distributor);
        return DistributorDto.fromEntity(distributor);
    }

    @Transactional
    public DistributorDto updateDistributor(Long organizationId, Long id, CreateDistributorRequest request) {
        Distributor distributor = findDistributorInOrg(organizationId, id);

        distributor.setName(request.getName());
        distributor.setContactPerson(request.getContactPerson());
        distributor.setPhone(request.getPhone());
        distributor.setEmail(request.getEmail());
        distributor.setAddress(request.getAddress());
        if (request.getStatus() != null) {
            distributor.setStatus(request.getStatus());
        }

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
            distributor.setUser(user);
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(request.getTerritoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found with id: " + request.getTerritoryId()));
            distributor.setTerritory(territory);
        }

        distributor = distributorRepository.save(distributor);
        return DistributorDto.fromEntity(distributor);
    }

    @Transactional
    public void deleteDistributor(Long organizationId, Long id) {
        Distributor distributor = findDistributorInOrg(organizationId, id);
        distributor.setStatus(Distributor.DistributorStatus.INACTIVE);
        distributorRepository.save(distributor);
    }

    private Distributor findDistributorInOrg(Long organizationId, Long id) {
        Distributor distributor = distributorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Distributor not found with id: " + id));
        if (!distributor.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Distributor not found with id: " + id);
        }
        return distributor;
    }
}
