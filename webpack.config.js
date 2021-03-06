var webpack = require('webpack');

module.exports = {
	output: {
		library: 'sct',
		libraryTarget: 'umd'
	},

	module: {
		preLoaders: [
			{
				test: /\.js$/,
				loader: 'eslint'
			}
		],

		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					presets: ['es2015']
				}
			}
		]
	},

	node: {
		console: false,
		global: false,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false,
		setImmediate: false
	}
};
