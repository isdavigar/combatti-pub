# ---- Build stage ----
# Contexto de build esperado: el directorio raíz del monorepo (platform/).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copiamos el POM padre y los módulos necesarios para construir auth-service.
COPY pom.xml ./
COPY common ./common
COPY gateway ./gateway
COPY services ./services
COPY pos-bridge ./pos-bridge

# -pl + -am construye auth-service y sus dependencias internas (common).
RUN mvn -B -ntp -pl services/auth-service -am clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/auth-service/target/auth-service.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
