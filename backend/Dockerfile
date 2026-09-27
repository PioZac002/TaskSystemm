# syntax=docker/dockerfile:1

# ── Build: compile the Spring Boot jar with the Maven wrapper ──────────────────
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ src/

# The Maven repository lives in a BuildKit cache, so rebuilds don't re-download dependencies
RUN --mount=type=cache,target=/root/.m2 \
    chmod +x mvnw \
    && ./mvnw -B -q package -DskipTests \
    && cp target/task-system-api-*.jar app.jar

# ── Runtime: JRE only, non-root user ───────────────────────────────────────────
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN groupadd --system tasksystem && useradd --system --gid tasksystem --home /app tasksystem
COPY --from=build /workspace/app.jar app.jar
USER tasksystem

EXPOSE 6901
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
