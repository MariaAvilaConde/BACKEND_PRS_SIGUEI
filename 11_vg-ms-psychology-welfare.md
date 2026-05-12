# 📋 Análisis: vg-ms-psychology-welfare

> **Microservicio de Psicología y Bienestar** — Gestión de evaluaciones psicológicas, bienestar estudiantil.

---

## Estado General: Regular ⚠️ | Puntuación: 5/10

---

## 📄 README — Descripción

| Campo | Valor |
|---|---|
| **Nombre** | vg-ms-psychology-welfare |
| **Descripción** | Gestiona evaluaciones psicológicas de estudiantes |
| **Puerto** | 9090 |
| **Spring Boot** | 3.5.6 |
| **Java** | 17 |
| **Base de datos** | PostgreSQL (Neon, sa-east-1) via R2DBC |
| **Migración BD** | ❌ No usa |
| **Seguridad** | ❌ Sin seguridad |
| **Mensajería** | ❌ No usa |

### Tecnologías
- Spring WebFlux, R2DBC, Lombok, Springdoc-OpenAPI, Actuator

### Variables de Entorno
```
STUDENTS_SERVICE_URL (default: http://localhost:9081)
INSTITUTIONS_SERVICE_URL (default: http://localhost:9080)
USERS_SERVICE_URL (default: http://localhost:9083)
```

### Dependencias Externas
- `vg-ms-students`, `vg-ms-institution-management`, `vg-ms-users-management`

---

## 🧩 Análisis Detallado

### 1. Arquitectura Hexagonal
- ✅ **Buena estructura hexagonal**: domain/ports/in, domain/ports/out, domain/models, application/usecases, infrastructure/adapters
- ✅ Ports de entrada y salida bien definidos
- ⚠️ Modelo de dominio usa UUID nativo — buena práctica

### 2. Seguridad
- ❌ **Sin Spring Security** — endpoints abiertos
- ❌ Actuator expone `include: "*"` sin protección
- ❌ Datos psicológicos sensibles de estudiantes accesibles sin autenticación

### 3. Configuración
- ❌ **Solo un `application.yml`** — sin perfiles dev/prod
- ❌ Credenciales hardcodeadas:
```yaml
username: neondb_owner
password: npg_kM0ICaT1ydAl
```

### 4. Comunicación
- Consume 3 servicios externos vía WebClient
- ❌ Sin resiliencia (circuit breakers, retries)
- ⚠️ WebClientConfig configurado pero sin timeouts

---

## 📊 Resumen

### ❌ Problemas Críticos
1. **Sin seguridad — datos psicológicos de menores accesibles públicamente** (GDPR/LEY de protección de datos)
2. Credenciales hardcodeadas
3. Sin perfiles dev/prod
4. Actuator expuesto sin protección

### ⚠️ Problemas Medios
1. Sin migraciones de BD
2. Sin resiliencia en WebClient
3. Paquete base: `pe.edu.vallegrande.sigei.psychology` — inconsistente (falta `welfare`)

### ✅ Buenas Prácticas
1. Arquitectura hexagonal con ports in/out
2. UUID para identificadores
3. WebClient configurado para comunicación inter-service

### 🔧 Recomendaciones
1. **URGENTE**: Agregar seguridad OAuth2/JWT — datos psicológicos requieren máxima protección
2. Crear perfiles dev/prod
3. Agregar circuit breakers para WebClient
4. Restringir Actuator
5. Considerar encriptación a nivel de campo para datos sensibles
