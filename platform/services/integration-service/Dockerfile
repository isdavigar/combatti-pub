# ---- Build stage ----
# Contexto de build esperado: el directorio raíz del monorepo (platform/).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY common ./common
COPY gateway ./gateway
COPY services ./services
COPY pos-bridge ./pos-bridge

RUN mvn -B -ntp -pl services/integration-service -am clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/integration-service/target/integration-service.jar app.jar
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "app.jar"]
