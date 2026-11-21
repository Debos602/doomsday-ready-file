FROM node:22-slim
WORKDIR /app

# Prisma's migration engine needs OpenSSL, which the slim image does not include.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# prisma.config.ts, prisma/ and src/config/env.js are needed by `prisma generate` (the postinstall step),
# so they are copied before `npm install`.
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm install --no-audit --no-fund

ENV PORT=4000
EXPOSE 4000

# Apply migrations, seed the sample data (safe to repeat), then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
