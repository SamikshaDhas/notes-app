# Use official Node.js LTS image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files into container
COPY . .

# Expose the port Hugging Face uses
EXPOSE 7860

# Start your server
CMD ["node", "server.js"]