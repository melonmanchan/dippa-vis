FROM node:10.9.0
ADD . /app
WORKDIR /app
RUN yarn install
EXPOSE 3300
CMD ["npm", "start"]
