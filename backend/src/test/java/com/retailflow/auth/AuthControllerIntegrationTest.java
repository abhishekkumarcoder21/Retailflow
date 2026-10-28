package com.retailflow.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailflow.auth.dto.LoginRequest;
import com.retailflow.auth.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should reject login with invalid credentials with 401 Unauthorized")
    void shouldRejectInvalidLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("Should reject login with blank email with 400 Validation Error")
    void shouldRejectBlankEmail() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Should successfully register organization and return auth response with JWT")
    void shouldRegisterNewOrganization() throws Exception {
        String uniqueSlug = "test-corp-" + System.currentTimeMillis();
        String uniqueEmail = "admin." + System.currentTimeMillis() + "@testcorp.com";

        RegisterRequest request = RegisterRequest.builder()
                .organizationName("Test Distribution Corp")
                .organizationSlug(uniqueSlug)
                .businessType("Wholesale FMCG")
                .firstName("Test")
                .lastName("Admin")
                .email(uniqueEmail)
                .password("SecurePass123!")
                .phone("+91-9999999999")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(cookie().exists("retailflow_token"));
    }
}
