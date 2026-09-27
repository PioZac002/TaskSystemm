package com.tasksystem.api.common.config;

import com.tasksystem.api.masterdata.MasterdataValue;
import com.tasksystem.api.masterdata.MasterdataValueRepository;
import com.tasksystem.api.user.Role;
import com.tasksystem.api.user.User;
import com.tasksystem.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

/**
 * Seeds a default admin account and issue labels on an empty database,
 * so the frontend can log in right after the first start.
 * Disabled outside the default/dev profiles.
 */
@Configuration
@Profile("!prod")
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    @Order(1)
    CommandLineRunner seedData(UserRepository userRepository,
                               MasterdataValueRepository masterdataValueRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User("Admin", "Admin", "admin@tasksystem.local",
                        passwordEncoder.encode("Admin123!"), null);
                admin.setRole(Role.ROLE_ADMIN);
                userRepository.save(admin);
                log.info("Seeded default admin account: admin@tasksystem.local / Admin123!");
            }

            if (masterdataValueRepository.count() == 0) {
                masterdataValueRepository.saveAll(List.of(
                        new MasterdataValue("ISSUE_LABEL", "BUG", "Bug", 1, "#ef4444"),
                        new MasterdataValue("ISSUE_LABEL", "FEATURE", "Feature", 2, "#3b82f6"),
                        new MasterdataValue("ISSUE_LABEL", "IMPROVEMENT", "Improvement", 3, "#22c55e"),
                        new MasterdataValue("ISSUE_LABEL", "DOCUMENTATION", "Documentation", 4, "#a855f7")
                ));
                log.info("Seeded default ISSUE_LABEL masterdata values");
            }
        };
    }
}
