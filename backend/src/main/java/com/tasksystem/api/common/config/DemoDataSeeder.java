package com.tasksystem.api.common.config;

import com.tasksystem.api.comment.Comment;
import com.tasksystem.api.comment.CommentRepository;
import com.tasksystem.api.issue.Issue;
import com.tasksystem.api.issue.IssuePriority;
import com.tasksystem.api.issue.IssueRepository;
import com.tasksystem.api.issue.IssueStatus;
import com.tasksystem.api.issue.activity.ActivityType;
import com.tasksystem.api.issue.activity.IssueActivity;
import com.tasksystem.api.issue.activity.IssueActivityRepository;
import com.tasksystem.api.masterdata.MasterdataValueRepository;
import com.tasksystem.api.project.Project;
import com.tasksystem.api.project.ProjectRepository;
import com.tasksystem.api.team.Team;
import com.tasksystem.api.team.TeamRepository;
import com.tasksystem.api.user.Role;
import com.tasksystem.api.user.User;
import com.tasksystem.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/**
 * Fills an empty database with a small, realistic workspace so the app can be tried right away:
 * demo accounts, teams, projects, issues in every workflow state, comments and activity history.
 * <p>
 * Enabled with {@code app.demo.seed=true} (on by default in the {@code docker} profile).
 * Runs once: it does nothing when any project already exists. Never runs on the {@code prod} profile.
 */
@Configuration
@Profile("!prod")
@ConditionalOnProperty(name = "app.demo.seed", havingValue = "true")
public class DemoDataSeeder {

    public static final String DEMO_PASSWORD = "Demo123!";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    @Bean
    @Order(2)
    CommandLineRunner seedDemoData(UserRepository users,
                                   TeamRepository teams,
                                   ProjectRepository projects,
                                   IssueRepository issues,
                                   CommentRepository comments,
                                   IssueActivityRepository activities,
                                   MasterdataValueRepository labels,
                                   PasswordEncoder passwordEncoder,
                                   TransactionTemplate transactionTemplate) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            if (projects.count() > 0) {
                log.info("Demo seed skipped: the database already contains projects");
                return;
            }

            User admin = users.findByEmailIgnoreCase("admin@tasksystem.local")
                    .orElseGet(() -> {
                        User created = new User("Admin", "Admin", "admin@tasksystem.local",
                                passwordEncoder.encode("Admin123!"), null);
                        created.setRole(Role.ROLE_ADMIN);
                        return users.save(created);
                    });
            User demo = user(users, passwordEncoder, "Demo", "User", "demo@tasksystem.local");
            User ola = user(users, passwordEncoder, "Ola", "Nowak", "ola@tasksystem.local");
            User kuba = user(users, passwordEncoder, "Kuba", "Wiśniewski", "kuba@tasksystem.local");
            User marta = user(users, passwordEncoder, "Marta", "Kowalczyk", "marta@tasksystem.local");

            Team frontend = team(teams, "Frontend", demo, kuba);
            Team backend = team(teams, "Backend", marta, admin);
            Team design = team(teams, "Product Design", ola, demo);

            Project web = projects.save(new Project("WEB", "Web App",
                    "React frontend: board, dashboard and the public landing page.", demo.getId()));
            Project api = projects.save(new Project("API", "Platform API",
                    "Spring Boot API: auth, issues, notifications and file storage.", marta.getId()));
            Project mobile = projects.save(new Project("MOBILE", "Mobile Client",
                    "Installable PWA experience for people on the go.", ola.getId()));

            LocalDate today = LocalDate.now();
            Seed seed = new Seed(issues, activities, comments, labels);

            Issue boardFlicker = seed.issue(web, "Board flickers after a status change",
                    "Dragging a card to another column re-renders the whole board for a frame.",
                    IssuePriority.HIGH, IssueStatus.IN_PROGRESS, ola, demo, frontend, today.plusDays(2), "BUG");
            seed.issue(web, "Keyboard shortcuts for the board",
                    "Arrow keys move the focused card between columns, Enter opens it.",
                    IssuePriority.NORMAL, IssueStatus.TODO, ola, demo, frontend, today.plusDays(9), "FEATURE");
            Issue emptyStates = seed.issue(web, "Empty state for the labels page",
                    "Show what labels are for and a button to create the first one.",
                    IssuePriority.LOW, IssueStatus.CODE_REVIEW, demo, demo, design, today.plusDays(5), "IMPROVEMENT");
            seed.issue(web, "Refresh token expires during drag and drop",
                    "A long drag that outlives the access token drops the card back to its origin.",
                    IssuePriority.CRITICAL, IssueStatus.TODO, kuba, demo, frontend, today.minusDays(1), "BUG");
            seed.issue(web, "Contrast audit for status badges",
                    "Check every status color in both themes against WCAG AA.",
                    IssuePriority.NORMAL, IssueStatus.DONE, ola, kuba, design, today.minusDays(6), "IMPROVEMENT");

            Issue slackId = seed.issue(api, "Slack user ID lost on profile save",
                    "Saving the profile form clears slackUserId when the field is untouched.",
                    IssuePriority.HIGH, IssueStatus.WAITING_FOR_TEAM, kuba, demo, backend, today.plusDays(1), "BUG");
            seed.issue(api, "Paginate the activity endpoint",
                    "Issues with long histories return thousands of rows in one response.",
                    IssuePriority.NORMAL, IssueStatus.TRIAGE, marta, admin, backend, today.plusDays(14), "IMPROVEMENT");
            seed.issue(api, "Document the issue update contract",
                    "Explain that PUT /issue/update is a full replacement and list the partial endpoints.",
                    IssuePriority.LOW, IssueStatus.NEW, marta, null, backend, null, "DOCUMENTATION");
            seed.issue(api, "Rotate refresh tokens on every use",
                    "Each refresh returns a new token and invalidates the previous one.",
                    IssuePriority.HIGH, IssueStatus.DONE, admin, marta, backend, today.minusDays(10), "FEATURE");
            seed.issue(api, "Weekly email digest",
                    "Summary of assigned and overdue issues every Monday morning.",
                    IssuePriority.LOW, IssueStatus.CANCELED, ola, null, null, null, "FEATURE");

            seed.issue(mobile, "Install prompt on Android",
                    "Offer the PWA install banner after the second visit.",
                    IssuePriority.NORMAL, IssueStatus.IN_PROGRESS, ola, ola, design, today.plusDays(4), "FEATURE");
            seed.issue(mobile, "Board carousel skips a column",
                    "Swiping fast on small screens jumps from To Do straight to Done.",
                    IssuePriority.HIGH, IssueStatus.TODO, demo, admin, frontend, today.minusDays(3), "BUG");
            seed.issue(mobile, "Offline banner copy",
                    "Tell people which actions still work without a connection.",
                    IssuePriority.LOW, IssueStatus.DONE, ola, demo, design, today.minusDays(2), "DOCUMENTATION");

            seed.comment(slackId, kuba, "@Marta the profile endpoint drops slackUserId on save. Can backend take a look?");
            seed.comment(slackId, marta, "Reproduced. The DTO mapping ignores the field when it is null in the payload.");
            seed.comment(boardFlicker, demo, "Happens only in Detailed mode, Basic mode looks fine.");
            seed.comment(emptyStates, ola, "Copy and illustration are ready, waiting for review.");

            projects.saveAll(List.of(web, api, mobile));

            log.info("Seeded demo workspace: 5 accounts (password {} for demo users), 3 teams, 3 projects, {} issues",
                    DEMO_PASSWORD, issues.count());
        });
    }

    private static User user(UserRepository users, PasswordEncoder encoder, String first, String last, String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseGet(() -> users.save(new User(first, last, email, encoder.encode(DEMO_PASSWORD), null)));
    }

    private static Team team(TeamRepository teams, String name, User... members) {
        Team team = new Team(name);
        team.getMembers().addAll(List.of(members));
        return teams.save(team);
    }

    private record Seed(IssueRepository issues,
                        IssueActivityRepository activities,
                        CommentRepository comments,
                        MasterdataValueRepository labels) {

        Issue issue(Project project, String title, String description, IssuePriority priority, IssueStatus status,
                    User author, User assignee, Team team, LocalDate dueDate, String labelCode) {
            String key = project.getShortName().toUpperCase(Locale.ROOT) + "-" + project.nextIssueNumber();
            Issue issue = new Issue(key, title, description, priority, author.getId(),
                    assignee != null ? assignee.getId() : null, project, dueDate);
            issue.setTeam(team);
            issue.setStatus(status);
            labels.findByTypeIgnoreCaseAndCodeIgnoreCase("ISSUE_LABEL", labelCode)
                    .ifPresent(label -> issue.getLabels().add(label));
            Issue saved = issues.save(issue);

            activities.save(new IssueActivity(saved.getId(), ActivityType.CREATED_ISSUE, author.getId()));
            if (status != IssueStatus.NEW) {
                IssueActivity statusChange = new IssueActivity(saved.getId(), ActivityType.UPDATED_STATUS,
                        assignee != null ? assignee.getId() : author.getId());
                statusChange.setOldStatus(IssueStatus.NEW.name());
                statusChange.setNewStatus(status.name());
                activities.save(statusChange);
            }
            return saved;
        }

        void comment(Issue issue, User author, String content) {
            comments.save(new Comment(issue.getId(), author.getId(), content));
            activities.save(new IssueActivity(issue.getId(), ActivityType.CREATED_COMMENT, author.getId()));
        }
    }
}
