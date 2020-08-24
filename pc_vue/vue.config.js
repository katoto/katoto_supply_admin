module.exports = {
    transpileDependencies: [
        /\bvue-awesome\b/,
    ],
    devServer: {
        proxy: 'http://192.168.0.104:7001', // 反向代理 http://39.107.28.114/api  http://192.168.0.102:7001
        open: true, // 自动打开浏览器
        disableHostCheck: true, // 取消检查host
    },
    css: {
        loaderOptions: {
            sass: {
                prependData: '@import "@/styles/variables.scss";', // 全局scss
            },
        },
    },
    publicPath: '/admin/',
};
