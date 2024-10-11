export default {
  preset: "ts-jest/presets/default-esm",
  verbose: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
