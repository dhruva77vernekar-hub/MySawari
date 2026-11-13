FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit
COPY . .
EXPOSE 4000
USER node
CMD ["npm", "start"]
