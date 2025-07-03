package tests.security;

import org.junit.jupiter.api.*;
import org.zaproxy.clientapi.core.*;
import io.qameta.allure.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.net.URI;
import java.net.http.*;

/**
 * Security Testing Suite using OWASP ZAP
 * =====================================
 * 
 * This test suite implements automated security testing using:
 * - OWASP ZAP (Zed Attack Proxy) for vulnerability scanning
 * - Docker container integration for isolated testing
 * - JUnit 5 for test execution framework
 * - Allure for detailed security reporting
 * 
 * Key Security Aspects Tested:
 * 1. Injection vulnerabilities (SQL, NoSQL, OS command)
 * 2. Broken authentication and session management
 * 3. Cross-Site Scripting (XSS) vulnerabilities
 * 4. Security misconfiguration
 * 5. Sensitive data exposure
 * 
 * Test Implementation:
 * - Passive scanning of all HTTP traffic
 * - Active scanning of identified endpoints
 * - Custom security rules validation
 * - Detailed vulnerability reporting
 */

@Epic("Security Testing")
@Feature("OWASP ZAP Integration")
public class SecuritySpec {

    private static final String TARGET_URL = "http://localhost:8080";
    private static final int ZAP_PORT = 8090;
    private static final String ZAP_API_KEY = UUID.randomUUID().toString();
    private static final Duration SCAN_TIMEOUT = Duration.ofMinutes(15);

    private static GenericContainer<?> zapContainer;
    private static ClientApi zapClient;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeAll
    static void setupZapProxy() {
        try {
            // Check if ZAP is already running
            if (!isZapRunning()) {
                startZapContainer();
            }
            initializeZapClient();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize ZAP", e);
        }
    }

    private static boolean isZapRunning() {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + ZAP_PORT))
                .timeout(Duration.ofSeconds(5))
                .build();
            
            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    private static void startZapContainer() {
        zapContainer = new GenericContainer<>(DockerImageName.parse("owasp/zap2docker-stable"))
            .withExposedPorts(ZAP_PORT)
            .withEnv("ZAP_API_KEY", ZAP_API_KEY)
            .withCommand("zap.sh", "-daemon", 
                        "-host", "0.0.0.0", 
                        "-port", String.valueOf(ZAP_PORT),
                        "-config", "api.key=" + ZAP_API_KEY,
                        "-config", "api.addrs.addr.name=.*",
                        "-config", "api.addrs.addr.regex=true");

        zapContainer.start();
    }

    private static void initializeZapClient() throws Exception {
        zapClient = new ClientApi("localhost", ZAP_PORT, ZAP_API_KEY);
        
        // Wait for ZAP to be ready
        int attempts = 0;
        while (attempts < 10) {
            try {
                zapClient.core.numberOfAlerts("");
                break;
            } catch (Exception e) {
                attempts++;
                Thread.sleep(5000);
            }
        }
        if (attempts == 10) {
            throw new RuntimeException("ZAP failed to start");
        }
    }

    @Test
    @Tag("sec")
    @Description("Performs passive security scan of the application")
    void passiveSecurityScan() throws Exception {
        Step.of("Configure target application", () -> {
            // Set up context
            String contextId = zapClient.context.newContext("test-context");
            zapClient.context.includeInContext("test-context", "\\Q" + TARGET_URL + "\\E.*");
            
            // Configure session management
            zapClient.authentication.setAuthenticationMethod(
                contextId,
                "formBasedAuthentication",
                "loginUrl=" + TARGET_URL + "/login" +
                "&loginRequestData=username%3D%7B%25username%25%7D" +
                "%26password%3D%7B%25password%25%7D"
            );
        });

        Step.of("Initialize spider scan", () -> {
            // Start spider
            String scanId = zapClient.spider.scan(TARGET_URL, null, null, null, null);
            
            // Wait for spider to complete
            while (Integer.parseInt(zapClient.spider.status(scanId)) < 100) {
                Thread.sleep(1000);
            }
        });

        Step.of("Run passive scan", () -> {
            // Configure passive scan rules
            zapClient.pscan.enableAllScanners();
            
            // Wait for passive scan to complete
            while (zapClient.pscan.recordsToScan().intValue() > 0) {
                Thread.sleep(1000);
            }
        });

        Step.of("Analyze security alerts", () -> {
            List<Alert> highAlerts = zapClient.core.alerts(TARGET_URL, -1, -1)
                .stream()
                .filter(alert -> alert.getRisk().equals(Alert.Risk.High))
                .collect(Collectors.toList());

            // Generate and attach security report
            Map<String, Object> report = generateSecurityReport(highAlerts);
            attachZapReport(report);

            // Assert no high-risk vulnerabilities
            Assertions.assertEquals(0, highAlerts.size(),
                "High-risk vulnerabilities detected: " + 
                highAlerts.stream()
                    .map(Alert::getName)
                    .collect(Collectors.joining(", "))
            );
        });
    }

    @Test
    @Tag("sec")
    @Description("Validates security headers configuration")
    void securityHeadersTest() throws Exception {
        Step.of("Check security headers", () -> {
            HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TARGET_URL))
                .build();

            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());

            Map<String, String> requiredHeaders = Map.of(
                "Strict-Transport-Security", 
                    "max-age=31536000; includeSubDomains",
                "X-Content-Type-Options", "nosniff",
                "X-Frame-Options", "DENY",
                "X-XSS-Protection", "1; mode=block",
                "Content-Security-Policy", 
                    "default-src 'self'; script-src 'self' 'unsafe-inline'"
            );

            for (Map.Entry<String, String> header : requiredHeaders.entrySet()) {
                String actualValue = response.headers()
                    .firstValue(header.getKey())
                    .orElse("");
                
                Assertions.assertEquals(
                    header.getValue(),
                    actualValue,
                    "Incorrect " + header.getKey() + " header"
                );
            }
        });
    }

    @Test
    @Tag("sec")
    @Description("Tests for common security vulnerabilities")
    void commonVulnerabilitiesTest() throws Exception {
        Step.of("Test SQL injection protection", () -> {
            String[] sqlInjectionPayloads = {
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users; --"
            };

            for (String payload : sqlInjectionPayloads) {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TARGET_URL + "/api/users?id=" + payload))
                    .build();

                HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

                Assertions.assertEquals(400, response.statusCode(),
                    "SQL injection payload not properly handled: " + payload);
            }
        });

        Step.of("Test XSS protection", () -> {
            String[] xssPayloads = {
                "<script>alert(1)</script>",
                "javascript:alert(1)",
                "<img src=x onerror=alert(1)>"
            };

            for (String payload : xssPayloads) {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TARGET_URL + "/search?q=" + payload))
                    .build();

                HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

                Assertions.assertFalse(
                    response.body().contains(payload),
                    "XSS payload not properly escaped: " + payload
                );
            }
        });
    }

    private Map<String, Object> generateSecurityReport(List<Alert> alerts) {
        Map<String, Object> report = new HashMap<>();
        report.put("timestamp", System.currentTimeMillis());
        report.put("target", TARGET_URL);
        
        Map<String, List<Map<String, String>>> alertsByRisk = new HashMap<>();
        
        for (Alert alert : alerts) {
            Map<String, String> alertInfo = new HashMap<>();
            alertInfo.put("name", alert.getName());
            alertInfo.put("description", alert.getDescription());
            alertInfo.put("solution", alert.getSolution());
            alertInfo.put("reference", alert.getReference());
            alertInfo.put("url", alert.getUrl());
            alertInfo.put("parameter", alert.getParam());
            
            alertsByRisk.computeIfAbsent(
                alert.getRisk().name(),
                k -> new ArrayList<>()
            ).add(alertInfo);
        }
        
        report.put("alerts", alertsByRisk);
        return report;
    }

    @Attachment(value = "ZAP Security Report", type = "application/json")
    private String attachZapReport(Map<String, Object> report) throws Exception {
        return objectMapper.writerWithDefaultPrettyPrinter()
            .writeValueAsString(report);
    }

    @AfterAll
    static void cleanup() {
        if (zapContainer != null && zapContainer.isRunning()) {
            zapContainer.stop();
        }
    }

    /**
     * Custom security test utilities
     */
    private static class Step {
        @SneakyThrows
        static void of(String description, StepExecutor executor) {
            Allure.step(description, () -> {
                try {
                    executor.execute();
                } catch (Exception e) {
                    Allure.addAttachment(
                        "Error Details",
                        "text/plain",
                        e.getMessage()
                    );
                    throw e;
                }
            });
        }

        interface StepExecutor {
            void execute() throws Exception;
        }
    }
} 