
FROM node:14

# Create a non-privileged user
RUN adduser --disabled-password --gecos "" myuser

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Switch to the non-privileged user
USER myuser

# Start the application
CMD ["npm", "start"]

