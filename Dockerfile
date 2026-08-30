# Builds the site and serves it through nginx, which is how it will be served if
# it ever moves off GitHub Pages onto a European host. `npm test` runs inside the
# image, so a container that starts is a container whose links resolve and whose
# pages request nothing off-origin.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# scripts/ carries the page manifest, which both the generator and the checks read.
# nginx-security.conf is here as well as in the serving stage below, because the
# checks compare its CSP header against the one in the markup.
COPY vite.config.js index.html 404.html nginx-security.conf ./
COPY src ./src
COPY scripts ./scripts
COPY tests ./tests
COPY public ./public

# One directory per page. Adding a page means adding it here, to vite.config.js
# and to scripts/pages.mjs — the checks fail loudly if any of the three is missed.
COPY two-weeks ./two-weeks
COPY kit ./kit
COPY law ./law
COPY institutions ./institutions
COPY how-we-work ./how-we-work
COPY about ./about
COPY contact ./contact
COPY privacy ./privacy
COPY legal ./legal
COPY accessibility ./accessibility

RUN npm test && npm run build

FROM nginx:1.27-alpine
COPY nginx-security.conf /etc/nginx/snippets/security.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
