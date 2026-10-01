# 백엔드 컨테이너 이미지.
#
# Cloud Run, Oracle Cloud, Render 등 컨테이너를 받는 곳이면 그대로 쓴다.
# 빌드 단계와 실행 단계를 나눠, 최종 이미지에는 JDK가 아닌 JRE와 JAR만 남긴다.

# ---- 빌드 ----
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# 의존성 목록이 바뀌지 않았으면 이 레이어는 캐시에서 재사용된다
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ---- 실행 ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# root로 돌리지 않는다
RUN useradd --system --uid 10001 app
USER app

COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar

# Cloud Run은 PORT 환경변수로 포트를 알려준다. application.yml이 이미 ${PORT:8080}을 본다.
EXPOSE 8080

# 컨테이너에 주어진 메모리에 맞춰 힙을 잡는다
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
