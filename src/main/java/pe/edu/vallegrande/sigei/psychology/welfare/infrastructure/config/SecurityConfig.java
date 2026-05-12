package pe.edu.vallegrande.sigei.psychology.welfare.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private static final String[] SWAGGER_PATHS = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/api-docs/**",
            "/webjars/**"
    };

    private static final String[] ACTUATOR_PATHS = {
            "/actuator/health",
            "/actuator/info"
    };

    private static final String[] READ_ROLES = {
            "ADMINISTRADOR",
            "DIRECTOR",
            "SUBDIRECTOR",
            "SECRETARIA",
            "DOCENTE",
            "PSICOLOGO"
    };

    private static final String[] WRITE_ROLES = {
            "ADMINISTRADOR",
            "DIRECTOR",
            "PSICOLOGO"
    };

    private static final String[] DELETE_ROLES = {
            "ADMINISTRADOR",
            "PSICOLOGO"
    };

    @Bean
    @Profile("dev")
    public SecurityWebFilterChain devSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(SWAGGER_PATHS).permitAll()
                        .pathMatchers(ACTUATOR_PATHS).permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/**").hasAnyRole(READ_ROLES)
                        .pathMatchers(HttpMethod.POST, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.PUT, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.DELETE, "/api/psychological-evaluations/*/hard").hasAnyRole("ADMINISTRADOR")
                        .pathMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole(DELETE_ROLES)
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(grantedAuthoritiesExtractor())))
                .build();
    }

    @Bean
    @Profile("prod")
    public SecurityWebFilterChain prodSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(SWAGGER_PATHS).denyAll()
                        .pathMatchers(ACTUATOR_PATHS).permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/**").hasAnyRole(READ_ROLES)
                        .pathMatchers(HttpMethod.POST, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.PUT, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole(WRITE_ROLES)
                        .pathMatchers(HttpMethod.DELETE, "/api/psychological-evaluations/*/hard").hasAnyRole("ADMINISTRADOR")
                        .pathMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole(DELETE_ROLES)
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(grantedAuthoritiesExtractor())))
                .build();
    }

    private Converter<Jwt, Mono<AbstractAuthenticationToken>> grantedAuthoritiesExtractor() {
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter);
    }

    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @SuppressWarnings("unchecked")
        @Override
        public Collection<GrantedAuthority> convert(@NonNull Jwt jwt) {
            List<GrantedAuthority> authorities = new ArrayList<>();

            // Roles de realm (realm_access.roles)
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof List) {
                ((List<String>) realmAccess.get("roles")).stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                        .forEach(authorities::add);
            }

            // Roles de cliente (resource_access.*.roles) — aquí vive PSICOLOGO de sigei-gateway
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                resourceAccess.values().stream()
                        .filter(v -> v instanceof Map)
                        .map(v -> (Map<String, Object>) v)
                        .filter(m -> m.get("roles") instanceof List)
                        .flatMap(m -> ((List<String>) m.get("roles")).stream())
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                        .forEach(authorities::add);
            }

            return authorities;
        }
    }
}
