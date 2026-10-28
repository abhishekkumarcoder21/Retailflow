package com.retailflow.security;

import com.retailflow.organization.entity.Organization;
import com.retailflow.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        // 256-bit test key
        String testSecret = "SuperSecureSecretKeyForTestingRetailFlowTokensAtLeast256BitsLength!";
        jwtService = new JwtService(testSecret, 3600000, "retailflow_token");

        Organization org = new Organization();
        org.setId(99L);
        org.setName("Test Org");

        User user = new User();
        user.setId(42L);
        user.setEmail("user@test.com");
        user.setPasswordHash("hash");
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setRole(User.Role.ADMIN);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setOrganization(org);

        userPrincipal = new UserPrincipal(user);
    }

    @Test
    @DisplayName("Should generate a valid JWT and parse claims correctly")
    void shouldGenerateAndValidateJwt() {
        String token = jwtService.generateToken(userPrincipal);
        assertNotNull(token);
        assertTrue(jwtService.validateToken(token));

        assertEquals(42L, jwtService.getUserIdFromToken(token));
        assertEquals(99L, jwtService.getOrganizationIdFromToken(token));
    }

    @Test
    @DisplayName("Should reject malformed or tampered JWT")
    void shouldRejectMalformedToken() {
        assertFalse(jwtService.validateToken("invalid.jwt.token"));
        assertFalse(jwtService.validateToken(""));
    }
}
