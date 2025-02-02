# Build stage
FROM node:18-alpine as build
WORKDIR /app

# Set build arguments
ARG VITE_ENV=production
ARG VITE_WS_URL=wss://api.peacewalker.my.id/ws

# Set environment variables
ENV VITE_ENV=$VITE_ENV
ENV VITE_WS_URL=$VITE_WS_URL

COPY ./fe/package*.json ./
RUN npm install
COPY ./fe .

# Build with environment variables
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files and configurations
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Create entrypoint script

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
