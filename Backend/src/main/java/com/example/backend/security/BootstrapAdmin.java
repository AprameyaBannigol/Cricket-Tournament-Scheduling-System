package com.example.backend.security;

import java.util.Set;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final Environment environment;
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public BootstrapAdmin(Environment environment, AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.environment = environment;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = environment.getProperty("BOOTSTRAP_ADMIN_EMAIL");
        String password = environment.getProperty("BOOTSTRAP_ADMIN_PASSWORD");
        if (email == null || email.isBlank() || password == null || password.length() < 12) return;
        if (!users.existsByRolesContaining(AppRole.ADMIN) && !users.existsByEmailIgnoreCase(email.trim())) {
            users.save(new AppUser(email.trim().toLowerCase(), passwordEncoder.encode(password), Set.of(AppRole.ADMIN)));
        }
    }
}
