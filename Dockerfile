# Use a base image with Node.js and npm
FROM node:14

# Set the working directory
WORKDIR /src

# Copy the Pulumi code into the container
COPY . /src/

# Install dependencies
RUN npm install -g @pulumi/pulumi \
    && npm install @pulumi/kubernetes

# Set the entry point
ENTRYPOINT ["node", "index.ts"]
