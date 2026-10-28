package com.retailflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private Long organizationId;
    private String organizationName;
    private String organizationSlug;
}
