# 1) 프론트 빌드
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# 2) 백엔드 빌드 (프론트 빌드 결과물을 static 리소스로 넣고 jar 생성)
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app
COPY backend/ .
COPY --from=frontend /app/dist ./src/main/resources/static
RUN ./gradlew bootJar --no-daemon -x test

# 3) 실행 이미지
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
