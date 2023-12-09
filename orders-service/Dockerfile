# We use node v 20 same as the Lambda functions
FROM node:20

# Create app directory
WORKDIR /app

# Install app dependencies
# (A wildcard is used to ensure both package.json and package-lock.json are copied)
COPY package*.json ./

RUN npm install

# Bundle app source i.e. the dist folder to the app folder in the container
COPY dist ./

ENV ADDRESS=0.0.0.0 PORT=80

# We expose port 80 and run the primary adapter using node
EXPOSE 80
CMD ["node", "./adapters/primary/orders-service/orders-service.adapter.js"]