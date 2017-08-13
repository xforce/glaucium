const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractStylus = new ExtractTextPlugin({
    filename: "[name].[contenthash].css",
    disable: process.env.NODE_ENV === "development"
});

module.exports = {
    entry: "./src/app.ts",
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: '[name].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'default.html',
            template: './src/layouts/default.ejs'
        }),
        new HtmlWebpackPlugin({
            filename: 'login.html',
            template: './src/layouts/login.ejs'
        }),
        extractStylus,
    ],
    module: {
        rules: [
            { test: /\.tsx?$/, exclude: /node_modules/, enforce: 'pre', loader: 'tslint-loader' },
            { test: /\.tsx?$/, exclude: /node_modules/, loader: "awesome-typescript-loader" },
            { test: /\.html$/, loader: 'raw-loader', exclude: ['./src/index.html'] },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                    }
                    // other vue-loader options go here
                }
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    objectAssign: 'Object.assign'
                }
            },
            {
                test: /\.styl$/,
                use: extractStylus.extract({
                    use: [
                        {
                            loader: "css-loader"
                        }, {
                            loader: "stylus-loader"
                        }],
                    // use style-loader in development 
                    fallback: "style-loader"
                })
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".html"],
        alias: {
            'public': path.resolve(__dirname, './public'),
            'vue$': 'vue/dist/vue.common.js'
        }
    },
    devServer: {
        historyApiFallback: {
            index: 'dist/index.html'
        },
        noInfo: true
    },
    devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
        new webpack.optimize.CommonsChunkPlugin({ name: "vendor", filename: "vendor-[chunkhash].js" })
    ])
    module.exports.output = {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: '[name]-[chunkhash].js'
    };
} else {
    module.exports.output = {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: '[name]-[chunkhash].js'
    };
}