FROM ccr.ccs.tencentyun.com/library/node:16

WORKDIR /app

COPY package*.json ./

RUN npm install --registry=https://registry.npmmirror.com

COPY . .

EXPOSE 3000

CMD ["npm", "start"] 