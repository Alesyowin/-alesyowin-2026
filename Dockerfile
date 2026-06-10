FROM directus/directus:11.14.1
USER root

# Instalăm extensia oficială Cloudinary pentru Directus 
RUN npm install @directus/storage-driver-cloudinary

COPY ./extensions/hooks/ticket-engine/dist /directus/extensions/ticket-engine/dist
COPY ./extensions/hooks/ticket-engine/package.json /directus/extensions/ticket-engine/package.json

COPY ./extensions/hooks/bonus-draws-engine/dist /directus/extensions/bonus-draws-engine/dist
COPY ./extensions/hooks/bonus-draws-engine/package.json /directus/extensions/bonus-draws-engine/package.json

RUN chown -R node:node /directus/extensions
RUN echo "=== EXTENSION FILES ===" && find /directus/extensions -type f
USER node
