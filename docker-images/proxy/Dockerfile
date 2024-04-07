FROM oven/bun:1.0.33 as build

WORKDIR /app

COPY ./web .

RUN bunx --bun vite build

FROM nginx:1.25.4-alpine3.18-slim

RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./docker-images/proxy/server.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80

CMD /bin/sh -c "envsubst '\$ROUTE' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf" && nginx -g 'daemon off;'