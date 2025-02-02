# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY ./fe/package*.json ./
RUN npm install
COPY ./fe .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
