# Build node image from Node Docker Hub
FROM node:16

# Set node environment as docker-build
ENV NODE_ENV="docker-build"

# Make app directory in container
RUN mkdir /app

# Identify working directory
WORKDIR /app

# Copy over app to app folder
COPY . /app

# Install rpm packages from package.json
RUN npm install --force

# Build the react app
RUN npm run build

# Reset node environment variable
ENV NODE_ENV=""

# Run the app as a non-privileged user
RUN chown -R 1001:0 . && chmod -R gu+s+rw .
USER 1001

# Expose server at port ( accessible outside of container)
EXPOSE 8080 

# Start app. Need to run setup first to prepare the app for production
CMD node backend/server.js

