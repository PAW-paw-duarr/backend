FROM node:22-alpine AS dep

WORKDIR /app

COPY ./package.json package-lock.json
RUN npm ci --omit=dev

COPY . /app/
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY --from=dep /app/node_modules /app/node_modules
COPY --from=dep /app/dist /app/dist

CMD ["node", "dist/server.js"]