FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p /data/media && chown -R node:node /data
USER node
EXPOSE 4000
CMD ["npm", "start"]
