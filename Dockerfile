
# Build node image from Node Docker Hub
FROM node:16

# Install Java and zip
RUN apt-get update && \
    apt-get install -y openjdk-11-jdk zip imagemagick

# Create a non-privileged user
RUN adduser --disabled-password --gecos "" myuser

# Make app directory in container
RUN mkdir /app

# Identify working directory
WORKDIR /app

# Copy the rest of the application files
COPY . .

RUN chown -R 1001:0 . && chmod -R gu+s+rw .
USER 1001
# Install npm packages from package.json
RUN npm install --force

# Build the react app
RUN npm run build

# Reset node environment variable
ENV NODE_ENV=""

# Expose server at port ( accessible outside of container)
EXPOSE 8080 

# Start the application
CMD NODE_ENV=production node --experimental-modules server.js