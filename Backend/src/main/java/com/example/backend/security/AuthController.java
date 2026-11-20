package com.example.backend.security;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final AppUserRepository users;
    private final CookieCsrfTokenRepository csrfTokens;

    public AuthController(AuthenticationManager authenticationManager,
            SecurityContextRepository contextRepository, AppUserRepository users,
            CookieCsrfTokenRepository csrfTokens) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.users = users;
        this.csrfTokens = csrfTokens;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) { return new CsrfResponse(token.getToken()); }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        try {
            Authentication authenticated = authenticationManager.authenticate(
                    org.springframework.security.authentication.UsernamePasswordAuthenticationToken.unauthenticated(
                            request.email().trim().toLowerCase(), request.password()));
            String selectedAuthority = "ROLE_" + request.selectedRole().name();
            boolean roleAssigned = authenticated.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals(selectedAuthority));
            if (!roleAssigned) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiError(403, "Selected role is not assigned to this account"));
            }

            UsernamePasswordAuthenticationToken roleContext = new UsernamePasswordAuthenticationToken(
                    authenticated.getPrincipal(), null, Set.of(new SimpleGrantedAuthority(selectedAuthority)));
            roleContext.setDetails(authenticated.getDetails());
            new ChangeSessionIdAuthenticationStrategy().onAuthentication(roleContext, servletRequest, servletResponse);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(roleContext);
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, servletRequest, servletResponse);
            csrfTokens.saveToken(null, servletRequest, servletResponse);
            return ResponseEntity.ok(currentUser(roleContext));
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiError(401, "Invalid email or password"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        csrfTokens.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError(401, "Authentication required"));
        }
        return ResponseEntity.ok(currentUser(authentication));
    }

    private CurrentUser currentUser(Authentication authentication) {
        AppUser user = users.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        Set<String> roles = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
        return new CurrentUser(user.getId(), user.getEmail(), roles);
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password, @NotNull AppRole selectedRole) { }
    public record CurrentUser(Long id, String email, Set<String> roles) { }
    public record CsrfResponse(String token) { }
    public record ApiError(int status, String detail) { }
}
