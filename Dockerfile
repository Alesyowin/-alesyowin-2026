FROM directus/directus:11.14.1

USER root
RUN corepack enable

USER node
RUN pnpm install @directus/storage-driver-cloudinary

USER root
COPY ./extensions/hooks/ticket-engine/dist /directus/extensions/ticket-engine/dist
COPY ./extensions/hooks/ticket-engine/package.json /directus/extensions/ticket-engine/package.json

COPY ./extensions/hooks/bonus-draws-engine/dist /directus/extensions/bonus-draws-engine/dist
COPY ./extensions/hooks/bonus-draws-engine/package.json /directus/extensions/bonus-draws-engine/package.json

COPY ./extensions/endpoints/leaderboard/dist /directus/extensions/leaderboard/dist
COPY ./extensions/endpoints/leaderboard/package.json /directus/extensions/leaderboard/package.json

RUN chown -R node:node /directus/extensions
RUN echo "=== EXTENSION FILES ===" && find /directus/extensions -type f
USER node
