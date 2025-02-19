FROM node:18-alpine
ENV TZ=Asia/Bangkok
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]