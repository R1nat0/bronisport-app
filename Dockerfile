FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_DADATA_TOKEN
ARG VITE_YANDEX_MAPS_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DADATA_TOKEN=${VITE_DADATA_TOKEN}
ENV VITE_YANDEX_MAPS_KEY=${VITE_YANDEX_MAPS_KEY}

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error()})"

CMD ["serve", "-s", "dist", "-l", "3000"]
