const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const Visualizer = require('webpack-visualizer-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

const extractStylus = new ExtractTextPlugin({
    filename: "[name].[contenthash].css",
    disable: process.env.NODE_ENV === "development"
});

const extractSass = new ExtractTextPlugin({
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
            {
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    ignoreCustomFragments: [/\{\{.*?}}/],
                    root: path.resolve(__dirname, 'src'),
                    attrs: ['img:src', 'link:href']
                }
            },
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: 'resolve-url-loader',
                        options: {
                            root: path.resolve(__dirname, 'src'),
                            debug: true
                        }
                    }, {
                        loader: "sass-loader"
                    }],
                    // use style-loader in development
                    fallback: "style-loader"
                })
            },
            {
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                include: [path.resolve('src'), path.resolve('test')],
                options: {
                  formatter: require('eslint-friendly-formatter')
                }
            },
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
                test: /\.(ico|jpg|png|gif|eot|otf|webp|ttf|woff|woff2|svg)(\?.*)?$/,
                loader: 'file-loader',
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