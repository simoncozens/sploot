const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = {
  entry: ["./src/ts/index.ts", "./src/styles/app.scss"],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".sass"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "src/index.html", to: "index.html" },
        { from: "src/harfbuzz.wasm", to: "assets/harfbuzz.wasm" },
        { context: "src/", from: "*.png", to: "assets/" },
        { context: "src/", from: "favicon.ico", to: "favicon.ico" },
        { context: "src/", from: "manifest.json", to: "manifest.json" },
      ],
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  mode: "development",
  devServer: {
    client: {
      overlay: false,
    },
    static: {
      directory: path.resolve(__dirname, "./assets"),
      publicPath: "/assets",
    },
  },
};
