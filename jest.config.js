const jest_mongodb = require("@shelf/jest-mongodb/jest-preset")

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jest_mongodb,
  preset: "ts-jest",
};
