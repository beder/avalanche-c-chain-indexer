# Use an official Node.js runtime as a base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install TypeScript globally
RUN npm install -g typescript

# Install the application dependencies
RUN npm install

# Copy the application code to the working directory
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port on which the application will run
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]