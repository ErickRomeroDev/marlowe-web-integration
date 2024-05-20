npm init -y

<!-- Install TypeScript, ts-node, Node.js types, Jest, and their types: -->
npm install typescript ts-node @types/node --save-dev
npm install jest @types/jest ts-jest --save-dev

<!-- Initialize TypeScript and Jest -->
npx tsc --init
npx ts-jest config:init

<!-- Configure packageJson scripts and configs, tsconfig.json (Folder setup --dist---src) -->

<!-- create an .env file -->

<!-- running the project -->
npm run build
npm run start
npm run test