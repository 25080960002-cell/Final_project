FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
ARG VITE_API_BASE_URL=
ARG VITE_ORGANIZATION_ID=1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_ORGANIZATION_ID=$VITE_ORGANIZATION_ID
RUN npm run build

FROM nginx:1-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
