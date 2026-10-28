package com.retailflow.user.service;

import com.retailflow.auth.dto.UserDto;
import com.retailflow.common.exception.ConflictException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.user.dto.CreateUserRequest;
import com.retailflow.user.dto.UpdateUserRequest;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Long organizationId, Pageable pageable) {
        return userRepository.findByOrganizationId(organizationId, pageable)
                .map(UserDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(Long organizationId, User.Role role) {
        return userRepository.findByOrganizationIdAndRole(organizationId, role)
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long organizationId, Long userId) {
        User user = findUserInOrg(organizationId, userId);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto createUser(Long organizationId, CreateUserRequest request) {
        if (userRepository.existsByOrganizationIdAndEmail(organizationId, request.getEmail())) {
            throw new ConflictException("User already exists with email: " + request.getEmail());
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with id: " + organizationId));

        User user = new User();
        user.setOrganization(org);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setStatus(User.UserStatus.ACTIVE);

        user = userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateUser(Long organizationId, Long userId, UpdateUserRequest request) {
        User user = findUserInOrg(organizationId, userId);

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getStatus() != null) user.setStatus(request.getStatus());

        user = userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto toggleUserStatus(Long organizationId, Long userId, User.UserStatus status) {
        User user = findUserInOrg(organizationId, userId);
        user.setStatus(status);
        user = userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    private User findUserInOrg(Long organizationId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return user;
    }
}
