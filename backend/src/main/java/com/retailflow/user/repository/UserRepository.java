package com.retailflow.user.repository;

import com.retailflow.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByOrganizationIdAndEmail(Long organizationId, String email);

    List<User> findByOrganizationIdAndRole(Long organizationId, User.Role role);

    Page<User> findByOrganizationId(Long organizationId, Pageable pageable);

    boolean existsByOrganizationIdAndEmail(Long organizationId, String email);

    long countByOrganizationIdAndRole(Long organizationId, User.Role role);
}
