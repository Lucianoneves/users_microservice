# Users - (c) 2026 Example Org
FROM node:16-alpine

WORKDIR /app

COPY . .
RUN npm install

EXPOSE 8080

CMD ["sh", "-c", "npm run dev"]
