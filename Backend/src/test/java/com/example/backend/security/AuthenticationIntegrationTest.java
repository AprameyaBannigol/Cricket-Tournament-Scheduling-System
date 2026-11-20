package com.example.backend.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:batch6auth;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.security.frontend-origin=http://localhost:5174"
})
@AutoConfigureMockMvc
class AuthenticationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AppUserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired PermissionService permissions;
    @Autowired RequestMappingHandlerMapping handlerMappings;
    private String testPassword;

    @BeforeEach
    void seedViewer() {
        jdbc.update("delete from organizer_tournament_assignment");
        jdbc.update("delete from team_manager_assignment");
        users.deleteAll();
        testPassword = randomPassword();
        users.saveAndFlush(new AppUser("viewer@example.org", encoder.encode(testPassword), Set.of(AppRole.VIEWER)));
    }

    @Test
    void loginPersistsSessionAndLogoutInvalidatesIt() throws Exception {
        assertFalsePlaintextIsStored();
        MvcResult result = mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(testPassword)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("viewer@example.org"))
            .andExpect(jsonPath("$.roles[0]").value("VIEWER")).andReturn();
        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);

        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidCredentialsAndUnauthenticatedWritesAreRejected() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginJson(testPassword)))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(randomPassword())))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.detail").value("Invalid email or password"));
        MvcResult deniedRole = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"viewer@example.org\",\"password\":\"" + testPassword + "\",\"selectedRole\":\"ADMIN\"}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.detail").value("Selected role is not assigned to this account")).andReturn();
        org.junit.jupiter.api.Assertions.assertNull(deniedRole.getRequest().getSession(false));
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"viewer@example.org\",\"password\":\"" + testPassword + "\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/tournaments").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Unauthorized tournament\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRequiresAssignedRoleAndScopesMultiRoleSessionToSelectedRole() throws Exception {
        AppUser multiRole = users.saveAndFlush(new AppUser("multi-role@example.org", encoder.encode(testPassword),
                Set.of(AppRole.ADMIN, AppRole.VIEWER)));

        MvcResult viewerLogin = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + multiRole.getEmail() + "\",\"password\":\"" + testPassword + "\",\"selectedRole\":\"VIEWER\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.roles").isArray())
            .andExpect(jsonPath("$.roles.length()").value(1)).andExpect(jsonPath("$.roles[0]").value("VIEWER"))
            .andReturn();
        MockHttpSession viewerSession = (MockHttpSession) viewerLogin.getRequest().getSession(false);
        mvc.perform(get("/api/auth/me").session(viewerSession)).andExpect(status().isOk())
            .andExpect(jsonPath("$.roles.length()").value(1)).andExpect(jsonPath("$.roles[0]").value("VIEWER"));
        mvc.perform(get("/api/admin/dashboard").session(viewerSession)).andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/logout").session(viewerSession).with(csrf())).andExpect(status().isNoContent());
        MockHttpSession adminSession = loginSession(multiRole.getEmail(), testPassword, AppRole.ADMIN);
        mvc.perform(get("/api/admin/dashboard").session(adminSession)).andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(Set.of(AppRole.ADMIN, AppRole.VIEWER),
                users.findById(multiRole.getId()).orElseThrow().getRoles());
    }

    @Test
    void disabledAccountCannotAuthenticate() throws Exception {
        AppUser disabled = users.saveAndFlush(new AppUser("disabled@example.org", encoder.encode(testPassword), Set.of(AppRole.VIEWER)));
        jdbc.update("update app_user set enabled=false where user_id=?", disabled.getId());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"disabled@example.org\",\"password\":\"" + testPassword + "\",\"selectedRole\":\"VIEWER\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.detail").value("Invalid email or password"));
    }

    @Test
    void viewerCannotCreateTournamentAndPublicFixtureReadsRemainAvailable() throws Exception {
        MvcResult login = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(testPassword)))
            .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mvc.perform(post("/api/tournaments").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Viewer attempt\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/tournaments")).andExpect(status().isOk());
    }

    @Test
    void adminDashboardIsAdminOnlyAndNeverReturnsPasswordHashes() throws Exception {
        MockHttpSession viewerSession = loginSession("viewer@example.org", testPassword);
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/dashboard").session(viewerSession)).andExpect(status().isForbidden());

        AppUser admin = saveAdmin();
        MockHttpSession adminSession = loginSession(admin.getEmail(), adminPassword);
        mvc.perform(get("/api/admin/dashboard").session(adminSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalUsers").isNumber())
            .andExpect(jsonPath("$.usersByRole.ADMIN").isNumber())
            .andExpect(jsonPath("$.totalTournaments").isNumber())
            .andExpect(jsonPath("$.totalTeams").isNumber())
            .andExpect(jsonPath("$.users[?(@.email=='" + admin.getEmail() + "')].passwordHash").doesNotExist());
    }

    @Test
    void exactlyFourRolesAndDashboardApiAccessMatrixAreEnforced() throws Exception {
        org.junit.jupiter.api.Assertions.assertEquals(Set.of("ADMIN", "ORGANIZER", "TEAM_MANAGER", "VIEWER"),
                java.util.Arrays.stream(AppRole.values()).map(Enum::name).collect(java.util.stream.Collectors.toSet()));
        jdbc.update("insert into tournament(tournament_id,name,status) values (961,'Role Matrix Cup','UPCOMING')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (971,961,'Role Matrix Team','ACTIVE')");

        String adminPass = randomPassword();
        String organizerPass = randomPassword();
        String managerPass = randomPassword();
        String viewerPass = randomPassword();
        AppUser admin = users.saveAndFlush(new AppUser("matrix-admin@example.org", encoder.encode(adminPass), Set.of(AppRole.ADMIN)));
        AppUser organizer = users.saveAndFlush(new AppUser("matrix-organizer@example.org", encoder.encode(organizerPass), Set.of(AppRole.ORGANIZER)));
        AppUser manager = users.saveAndFlush(new AppUser("matrix-manager@example.org", encoder.encode(managerPass), Set.of(AppRole.TEAM_MANAGER)));
        AppUser viewer = users.saveAndFlush(new AppUser("matrix-viewer@example.org", encoder.encode(viewerPass), Set.of(AppRole.VIEWER)));
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,961)", organizer.getId());
        jdbc.update("insert into team_manager_assignment(user_id,team_id) values (?,971)", manager.getId());
        MockHttpSession adminSession = loginSession(admin.getEmail(), adminPass);
        MockHttpSession organizerSession = loginSession(organizer.getEmail(), organizerPass);
        MockHttpSession managerSession = loginSession(manager.getEmail(), managerPass);
        MockHttpSession viewerSession = loginSession(viewer.getEmail(), viewerPass);

        mvc.perform(get("/api/admin/dashboard").session(adminSession)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").session(organizerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard").session(managerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard").session(viewerSession)).andExpect(status().isForbidden());

        mvc.perform(get("/api/organizer/dashboard").session(adminSession)).andExpect(status().isOk());
        mvc.perform(get("/api/organizer/dashboard").session(organizerSession)).andExpect(status().isOk());
        mvc.perform(get("/api/organizer/dashboard").session(managerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/organizer/dashboard").session(viewerSession)).andExpect(status().isForbidden());

        mvc.perform(get("/api/team-manager/dashboard").session(adminSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/team-manager/dashboard").session(organizerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/team-manager/dashboard").session(managerSession)).andExpect(status().isOk());
        mvc.perform(get("/api/team-manager/dashboard").session(viewerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/tournaments/961").session(viewerSession)).andExpect(status().isOk());
        String tournamentUpdate = "{\"name\":\"Updated Role Matrix Cup\"}";
        mvc.perform(put("/api/tournaments/961").session(adminSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(tournamentUpdate)).andExpect(status().isOk());
        mvc.perform(put("/api/tournaments/961").session(organizerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(tournamentUpdate)).andExpect(status().isOk());
        mvc.perform(put("/api/tournaments/961").session(managerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(tournamentUpdate)).andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/961").session(viewerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(tournamentUpdate)).andExpect(status().isForbidden());
    }

    @Test
    void everyNonAuthenticationMutationEndpointDeclaresBackendAuthorization() {
        handlerMappings.getHandlerMethods().forEach((mapping, handler) -> {
            boolean mutating = mapping.getMethodsCondition().getMethods().stream().anyMatch(method ->
                    method == RequestMethod.POST || method == RequestMethod.PUT
                    || method == RequestMethod.PATCH || method == RequestMethod.DELETE);
            if (!mutating || handler.getBeanType().equals(AuthController.class)) return;
            boolean methodProtected = AnnotatedElementUtils.findMergedAnnotation(handler.getMethod(), PreAuthorize.class) != null;
            boolean controllerProtected = AnnotatedElementUtils.findMergedAnnotation(handler.getBeanType(), PreAuthorize.class) != null;
            org.junit.jupiter.api.Assertions.assertTrue(methodProtected || controllerProtected,
                    () -> "Unsafe API handler lacks role authorization: " + mapping.getPatternValues());
        });
    }

    @Test
    void adminCanCreateAccountsAndDuplicateEmailIsRejected() throws Exception {
        AppUser admin = saveAdmin();
        MockHttpSession session = loginSession(admin.getEmail(), adminPassword);
        String email = "new-" + UUID.randomUUID() + "@example.org";
        String body = "{\"email\":\"" + email + "\",\"password\":\"" + randomPassword() + "\",\"roles\":[\"ORGANIZER\"]}";

        mvc.perform(post("/api/admin/accounts").session(session).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/accounts").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email)).andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(post("/api/admin/accounts").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void adminCanUpdateRolesAndAssignExistingTournamentAndTeam() throws Exception {
        AppUser admin = saveAdmin();
        MockHttpSession session = loginSession(admin.getEmail(), adminPassword);
        AppUser organizer = users.saveAndFlush(new AppUser("organizer-" + UUID.randomUUID() + "@example.org",
                encoder.encode(randomPassword()), Set.of(AppRole.VIEWER)));
        AppUser manager = users.saveAndFlush(new AppUser("manager-" + UUID.randomUUID() + "@example.org",
                encoder.encode(randomPassword()), Set.of(AppRole.TEAM_MANAGER)));
        jdbc.update("insert into tournament(tournament_id,name,status) values (941,'Admin Cup','UPCOMING')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (951,941,'Admin Team','ACTIVE')");

        mvc.perform(put("/api/admin/accounts/{id}/roles", organizer.getId()).session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"ORGANIZER\"]}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.roles[0]").value("ORGANIZER"));
        mvc.perform(put("/api/admin/accounts/{id}/roles", organizer.getId()).session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"roles\":[\"UNKNOWN\"]}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/accounts/organizer-assignment").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"userId\":" + organizer.getId() + ",\"tournamentId\":941}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/admin/accounts/team-manager-assignment").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"userId\":" + manager.getId() + ",\"teamId\":951}"))
            .andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.users[?(@.email=='" + organizer.getEmail() + "')].tournaments[0].tournamentId").value(941))
            .andExpect(jsonPath("$.users[?(@.email=='" + manager.getEmail() + "')].teams[0].teamId").value(951));
        mvc.perform(post("/api/admin/accounts/organizer-assignment").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"userId\":" + organizer.getId() + ",\"tournamentId\":999999}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void organizerAndTeamManagerPermissionsAreScopedToAssignedResources() {
        jdbc.update("insert into tournament(tournament_id,name,status) values (401,'Security Cup','UPCOMING')");
        jdbc.update("insert into tournament(tournament_id,name,status) values (402,'Other Cup','UPCOMING')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (501,401,'Assigned Team','ACTIVE')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (502,402,'Other Team','ACTIVE')");
        AppUser organizer = users.saveAndFlush(new AppUser("organizer@example.org", encoder.encode(randomPassword()), Set.of(AppRole.ORGANIZER)));
        AppUser manager = users.saveAndFlush(new AppUser("manager@example.org", encoder.encode(randomPassword()), Set.of(AppRole.TEAM_MANAGER)));
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,401)", organizer.getId());
        jdbc.update("insert into team_manager_assignment(user_id,team_id) values (?,501)", manager.getId());
        var organizerAuth = UsernamePasswordAuthenticationToken.authenticated(organizer.getEmail(), "",
                Set.of(new SimpleGrantedAuthority("ROLE_ORGANIZER")));
        var managerAuth = UsernamePasswordAuthenticationToken.authenticated(manager.getEmail(), "",
                Set.of(new SimpleGrantedAuthority("ROLE_TEAM_MANAGER")));

        org.junit.jupiter.api.Assertions.assertTrue(permissions.canManageTournament(organizerAuth, 401L));
        org.junit.jupiter.api.Assertions.assertFalse(permissions.canManageTournament(organizerAuth, 402L));
        org.junit.jupiter.api.Assertions.assertTrue(permissions.canManageTeam(managerAuth, 501L));
        org.junit.jupiter.api.Assertions.assertFalse(permissions.canManageTeam(managerAuth, 502L));
        org.junit.jupiter.api.Assertions.assertTrue(permissions.canManageSchedulingResource(managerAuth, 401L, "teams", 501L));
        org.junit.jupiter.api.Assertions.assertFalse(permissions.canManageSchedulingResource(managerAuth, 402L, "teams", 501L));
        org.junit.jupiter.api.Assertions.assertTrue(permissions.canManageTournamentOrTeam(managerAuth, 401L, 501L));
        org.junit.jupiter.api.Assertions.assertFalse(permissions.canManageTournamentOrTeam(managerAuth, 402L, 501L));
    }

    private void assertFalsePlaintextIsStored() {
        AppUser account = users.findByEmailIgnoreCase("viewer@example.org").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals(testPassword, account.getPasswordHash());
        org.junit.jupiter.api.Assertions.assertTrue(encoder.matches(testPassword, account.getPasswordHash()));
    }

    private String adminPassword;
    private AppUser saveAdmin() {
        adminPassword = randomPassword();
        return users.saveAndFlush(new AppUser("admin-" + UUID.randomUUID() + "@example.org",
                encoder.encode(adminPassword), Set.of(AppRole.ADMIN)));
    }
    private MockHttpSession loginSession(String email, String password) throws Exception {
        String role = users.findByEmailIgnoreCase(email).orElseThrow().getRoles().stream().findFirst().orElseThrow().name();
        return loginSession(email, password, AppRole.valueOf(role));
    }
    private MockHttpSession loginSession(String email, String password, AppRole selectedRole) throws Exception {
        MvcResult login = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"selectedRole\":\"" + selectedRole.name() + "\"}"))
            .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) login.getRequest().getSession(false);
    }

    private String randomPassword() { return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""); }
    private String loginJson(String password) {
        return "{\"email\":\"viewer@example.org\",\"password\":\"" + password + "\",\"selectedRole\":\"VIEWER\"}";
    }
}
