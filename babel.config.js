module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Plugin 1: Dotenv
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ], // <-- Chú ý dấu phẩy kết thúc mảng con này

      // Plugin 2: Reanimated (PHẢI LUÔN Ở CUỐI CÙNG)
      "react-native-reanimated/plugin",
    ],
  };
};
