const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "source-map",
  stats: {
    errorDetails: true,
  },
  entry: {
    content: "./src/content/index.tsx",
    background: "./src/background.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    publicPath: "/",
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      chrome: "88",
                    },
                    modules: false,
                  },
                ],
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              plugins: ["@babel/plugin-transform-runtime"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: "esnext",
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        type: "javascript/auto",
        use: ["babel-loader"],
        exclude: /node_modules/,
      },
      {
        test: /lame\.all\.js$/,
        use: [
          {
            loader: "babel-loader",
          },
          {
            loader: "expose-loader",
            options: {
              exposes: {
                globalName: "lamejs",
                override: true,
              },
            },
          },
        ],
      },
      {
        test: /lamejs-init\.js$/,
        type: "javascript/auto",
        use: ["babel-loader"],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]--[hash:base64:5]",
                exportLocalsConvention: "camelCase",
              },
              importLoaders: 2,
              sourceMap: true,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["autoprefixer"],
              },
              sourceMap: true,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              api: "modern",
              implementation: require("sass"),
              sassOptions: {
                includePaths: [path.resolve(__dirname, "src/styles")],
                outputStyle: "compressed",
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "icons/[name][ext]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".json"],
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@services": path.resolve(__dirname, "src/services"),
    },
    fallback: {
      path: "path-browserify",
      fs: false,
      crypto: false,
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          to: "manifest.json",
          transform(content) {
            return Buffer.from(
              JSON.stringify({
                ...JSON.parse(content.toString()),
                version: process.env.npm_package_version,
              })
            );
          },
        },
        {
          from: "icons/icon*.{png,svg}",
          to: "icons/[name][ext]",
          force: true,
          noErrorOnMissing: true,
        },
        {
          from: "node_modules/lamejs/lame.all.js",
          to: "lib/lame.all.js",
        },
      ],
    }),
  ],
};
