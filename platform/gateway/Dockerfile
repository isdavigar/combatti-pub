# ---- Build stage ----
# Contexto de build esperado: el directorio raíz del monorepo (platform/).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY common ./common
COPY gateway ./gateway
COPY services ./services

RUN mvn -B -ntp -pl gateway -am clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/gateway/target/gateway.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
