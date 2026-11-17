# Use an actively supported Node.js LTS release; pin a digest before production use.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# This learning app uses Node's built-in HTTP/test modules and has no dependencies.
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
