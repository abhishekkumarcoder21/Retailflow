package com.retailflow.audit.service;

import com.retailflow.audit.dto.AuditLogDto;
import com.retailflow.audit.entity.AuditLog;
import com.retailflow.audit.repository.AuditLogRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(Long organizationId, Pageable pageable) {
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId, pageable)
                .map(AuditLogDto::fromEntity);
    }

    @Transactional
    public void logEvent(Long organizationId, Long userId, String action, String entityType, Long entityId, String details, String ip) {
        Organization org = organizationRepository.findById(organizationId).orElse(null);
        if (org == null) return;

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        AuditLog log = new AuditLog();
        log.setOrganization(org);
        log.setUser(user);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setIpAddress(ip);

        auditLogRepository.save(log);
    }
}
