"use strict";

const path = require("path");

const babelLoader = {
  loader: "babel-loader",
  options: {
    presets: ["@babel/preset-env", "@babel/preset-typescript"],
  },
};
const tsLoader = {
  loader: "ts-loader",
};

module.exports = function () {
  return [
    {
      target: "node",
      entry: path.resolve(__dirname, "src/index.ts"),
      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
        library: "Stonk",
        globalObject: "this",
        libraryTarget: "umd",
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: [babelLoader, tsLoader],
            exclude: /node_modules[/\\](?!stonk-bot).*$/,
          },
          {
            test: /\.jsx?$/,
            use: [babelLoader],
            exclude: /node_modules[/\\](?!stonk-bot).*$/,
          },
        ],
      },
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
      }
    },
  ];
};
