module.exports = {
    publicPath: '',
    transpileDependencies: [
        "vuetify",
    ],

    configureWebpack: {
        devServer: {
            historyApiFallback: false,
        },
    },

    chainWebpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            // disable type checking on production build.
            // I know what I'm doing!
            // https://github.com/vuejs/vue-cli/issues/3157#issuecomment-629610739
            config.plugins.delete('fork-ts-checker');
        }

        config
            .plugin('define')
            .tap(args => {
                args[0].__BUILD_TIME__ = Date.now();

                return args;
            });
    },
};
