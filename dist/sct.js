(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["sct"] = factory();
	else
		root["sct"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var runtime = exports.runtime = __webpack_require__(1);

	var createObject = Object.create;
	var getPrototypeOf = Object.getPrototypeOf;
	var getObjectKeys = Object.keys;

	var reName = '[$_a-zA-Z][$\\w]*';
	var rePath = '(\\.?[$_a-zA-Z][$\\w]*(?:\\??\\(\\))*(?:\\??\\.[$_a-zA-Z][$\\w]*(?:\\??\\(\\))*)*)';
	var reExpression = '(\\S[\\s\\S]*?)';
	var reInsert = RegExp(['\\{\\{(?:',
	// 0
	'\\s*' + rePath + '\\s*', '|',
	// 1
	'\\{\\s*' + rePath + '\\s*\\}', '|',
	// 2
	',\\s*' + reExpression + '\\s*', '|',
	// 3
	'\\{,\\s*' + reExpression + '\\s*\\}', '|',
	// 4
	';\\s*' + reExpression + '\\s*', '|',
	// 5?, 6?, 7, 8?
	'\\?(\\?)?\\s*(!)?\\s*' + rePath + '\\s*(?::(' + reName + ')\\s*)?', '|',
	// 9
	'(\\?)\\?', '|',
	// 10
	'(\\/)\\?[\\s\\S]*?', '|',
	// 11, 12, 13?
	'~\\s*' + rePath + '\\s*:(' + reName + ')\\s*(?::(' + reName + ')\\s*)?', '|',
	// 14
	'(\\/)~[\\s\\S]*?', '|',
	// 15, 16?
	'@\\s*(' + reName + ')\\s*(?::(' + reName + '\\s*(?::' + reName + '\\s*)*))?', '|',
	// 17
	'(\\/)@[\\s\\S]*?', '|',
	// '1'.match(/.*?/) -> ['']
	// '1'.match(/(?:.*?)?/) -> [1]
	// '1'.match(/(?:.*?)??/) -> ['']
	// 18, 19, 20?
	'(=|#)\\s*(' + reName + ')(?:\\s+' + reExpression + ')??\\s*', '|',
	// 21
	'(\\/)#[\\s\\S]*?', '|',
	// 22
	'>\\s*' + reExpression + '\\s*', '|', '\\/\\/[\\s\\S]*?', ')\\}\\}'].join(''));

	/**
	 * @typesign (tmpl: string, opts?: { collapseWhitespaces: boolean }) -> string;
	 */
	function templateToFnBodyExpression(tmpl, opts) {
		var state = [];

		var rootScope = createObject(null);
		var scope = rootScope;

		rootScope.it = 'it';
		rootScope.escape = 'escape';
		rootScope.include = 'include';
		rootScope.helpers = 'helpers';
		rootScope.each = 'each';
		rootScope.out = 'out';

		var partials = createObject(null);

		var js = [];

		function push(expr) {
			if (expr == "''") {
				return;
			}

			if (state.length && state[0].type == 'push') {
				if (expr[0] == '\'') {
					var prev = js[js.length - 1];

					if (prev[prev.length - 1] == '\'') {
						js[js.length - 1] = prev.slice(0, -1) + expr.slice(1);
						return;
					}
				}

				js.push(', ' + expr);
			} else {
				state.unshift({ type: 'push' });
				js.push(' out.push(' + expr);
			}
		}

		function endPush() {
			if (state.length && state[0].type == 'push') {
				state.shift();
				js.push(');');
			}
		}

		function scopifyVariable(variable) {
			if (!(variable in scope)) {
				rootScope[variable] = variable;
				return variable;
			}

			var delimiter = /\d/.test(variable[variable.length - 1]) ? '_' : '';
			var index = 2;
			var scopedVariable = void 0;

			while ((scopedVariable = variable + delimiter + index) in scope) {
				index++;
			}

			rootScope[scopedVariable] = scopedVariable;
			scope[variable] = scopedVariable;

			return scopedVariable;
		}

		function descopifyPath(path) {
			return path.replace(/^[$\w]+/, function (name) {
				return scope[name];
			});
		}

		function pathToExpression(path, variable) {
			if (path[0] != '.' && !(path.match(/^([$\w]+)/)[1] in scope)) {
				path = '.' + path;
			}

			var fromIt = path[0] == '.';

			path = path.split('?');

			if (path.length == 1) {
				return (variable ? scopifyVariable(variable) + ' = ' : '') + (fromIt ? 'it' + path[0] : descopifyPath(path[0]));
			}

			var i = void 0;
			var expr = void 0;

			if (fromIt || /[^$\w]/.test(path[0])) {
				i = 1;
				expr = ['(temp = ' + (fromIt ? 'it' + path[0] : descopifyPath(path[0])) + ')'];

				// если не fromIt и path[0] не содержит что-то кроме [$\w], т. е.: `name?...`
			} else {
				var descopedFirstPathPart = descopifyPath(path[0]);

				if (path.length == 2) {
					return descopedFirstPathPart + ' && ' + (variable ? '(' + scopifyVariable(variable) + ' = ' : '') + descopedFirstPathPart + path[1] + (variable ? ')' : '');
				}

				i = 2;
				expr = [descopedFirstPathPart + ' && (temp = ' + descopedFirstPathPart + path[1] + ')'];
			}

			rootScope.temp = 'temp';

			for (var l = path.length - 1; i < l; i++) {
				expr.push(' && (temp = temp' + path[i] + ')');
			}

			return expr.join('') + ' && ' + (variable ? '(' + scopifyVariable(variable) + ' = ' : '') + 'temp' + path[i] + (variable ? ')' : '');
		}

		tmpl = tmpl.split(reInsert);

		for (var i = 0, l = tmpl.length; i < l;) {
			if (i % 24) {
				if (tmpl[i]) {
					push('escape(' + pathToExpression(tmpl[i]) + ')');
				} else if (tmpl[i + 1]) {
					push(pathToExpression(tmpl[i + 1]));
				} else if (tmpl[i + 2]) {
					push('escape(' + tmpl[i + 2] + ')');
				} else if (tmpl[i + 3]) {
					push(tmpl[i + 3]);
				} else if (tmpl[i + 4]) {
					endPush();
					js.push(' ' + tmpl[i + 4]);
				} else if (tmpl[i + 7]) {
					endPush();

					var elseIf = tmpl[i + 5];

					if (elseIf) {
						if (!state.length || state[0].type != 'if') {
							throw new SyntaxError("Unexpected token '??'");
						}
					} else {
						state.unshift({ type: 'if' });
						scope = createObject(scope);
					}

					var not = tmpl[i + 6];
					var expr = pathToExpression(tmpl[i + 7], tmpl[i + 8]);

					js.push((elseIf ? ' } else' : '') + ' if (' + (not ? '!' : '') + (not && /=|&/.test(expr) ? '(' + expr + ')' : expr) + ') {');
				} else if (tmpl[i + 9]) {
					endPush();

					if (!state.length || state[0].type != 'if') {
						throw new SyntaxError("Unexpected token '??'");
					}

					js.push(' } else {');
				} else if (tmpl[i + 10]) {
					endPush();

					if (!state.length || state[0].type != 'if') {
						throw new SyntaxError("Unexpected token '/?'");
					}

					state.shift();
					scope = getPrototypeOf(scope);
					js.push(' }');
				} else if (tmpl[i + 11]) {
					endPush();

					var valueVariable = tmpl[i + 12];
					var keyVariable = tmpl[i + 13];

					state.unshift({ type: 'for' });

					scope = createObject(scope);
					scope[valueVariable] = valueVariable;
					if (keyVariable) {
						scope[keyVariable] = keyVariable;
					}

					js.push(' each(' + pathToExpression(tmpl[i + 11]) + ', function(' + valueVariable + (keyVariable ? ', ' + keyVariable : '') + ') {');
				} else if (tmpl[i + 14]) {
					endPush();

					if (!state.length || state[0].type != 'for') {
						throw new SyntaxError("Unexpected token '/~'");
					}

					state.shift();
					scope = getPrototypeOf(scope);
					js.push(' }, it);');
				} else if (tmpl[i + 15]) {
					endPush();

					var name = tmpl[i + 15];
					var params = tmpl[i + 16] ? tmpl[i + 16].trim().split(/\s*:/) : [];

					state.unshift({ type: 'partial' });

					scope = createObject(scope);

					for (var _i = params.length; _i;) {
						var param = params[--_i];
						scope[param] = param;
					}

					partials[name] = true;
					partials = createObject(partials);

					js.push(' function ' + name + '(' + params.join(', ') + ') {');
				} else if (tmpl[i + 17]) {
					endPush();

					if (!state.length || state[0].type != 'partial') {
						throw new SyntaxError("Unexpected token '/@'");
					}

					state.shift();
					scope = getPrototypeOf(scope);
					partials = getPrototypeOf(partials);
					js.push(' }');
				} else if (tmpl[i + 18]) {
					var type = tmpl[i + 18];
					var _name = tmpl[i + 19];
					var _params = tmpl[i + 20];

					push((_name in partials ? '' : 'helpers.') + _name + '.call(it' + (type == '=' ? (_params ? ', ' + _params : '') + ')' : ', (function(out) {'));

					if (type == '#') {
						state.unshift({ type: 'call', params: _params });
					}
				} else if (tmpl[i + 21]) {
					endPush();

					if (!state.length || state[0].type != 'call') {
						throw new SyntaxError("Unexpected token '/#'");
					}

					var _params2 = state.shift().params;

					js.push(" return out; }).call(it, []).join('')" + (_params2 ? ', ' + _params2 : '') + ')');
				} else if (tmpl[i + 22]) {
					push('include.call(it, ' + tmpl[i + 22] + ')');
				}

				i += 23;
			} else {
				var str = tmpl[i].split('\\').join('\\\\').split('\'').join('\\\'');

				if (opts && opts.collapseWhitespaces === false) {
					str = str.split('\r').join('\\r').split('\n').join('\\n');
				} else {
					str = str.replace(/\s+/g, ' ');
				}

				push('\'' + str + '\'');

				i++;
			}
		}

		endPush();

		if (state.length) {
			throw new SyntaxError('Missing "/' + { 'if': '?', 'for': '~', partial: '@', call: '#' }[state[0].type] + '" in compound statement');
		}

		var initiallyDeclaredVariables = ['it', 'escape', 'include', 'helpers', 'each', 'out'];
		var laterDeclaredVariables = getObjectKeys(rootScope).filter(function (variable) {
			return initiallyDeclaredVariables.indexOf(variable) == -1;
		});

		return 'var ' + (laterDeclaredVariables.length ? laterDeclaredVariables.sort().join(', ') + ', ' : '') + 'out = [];' + js.join('') + " return out.join('');";
	}

	exports.toFnBodyExpression = templateToFnBodyExpression;

	/**
	 * @typedef {{
	 *     escape?: (str: string) -> string,
	 *     include?: (name: string) -> string,
	 *     helpers?: Object<Function>,
	 *     each?: ()
	 * }} sct~Options
	 */

	/**
	 * @typesign (tmpl: Function, opts?: sct~Options) -> { render: (data: Object, opts?: sct~Options) -> string };
	 */
	function compileTemplate(tmpl, opts) {
		return runtime.prepareTemplate(Function('it, escape, include, helpers, each', templateToFnBodyExpression(tmpl)), opts);
	}

	exports.compile = compileTemplate;

/***/ },
/* 1 */
/***/ function(module, exports) {

	var hasOwn = Object.prototype.hasOwnProperty;

	var reAmpersand = /&/g;
	var reLessThan = /</g;
	var reGreaterThan = />/g;
	var reQuote = /"/g;

	function escape(value) {
		if (value == null) {
			return '';
		}
		return value.toString()
			.replace(reAmpersand, '&amp;')
			.replace(reLessThan, '&lt;')
			.replace(reGreaterThan, '&gt;')
			.replace(reQuote, '&quot;');
	}

	function each(target, cb, context) {
		if (target) {
			if (Array.isArray(target)) {
				for (var i = 0, l = target.length; i < l; i++) {
					cb.call(context, target[i], i);
				}
			} else if (typeof target.forEach == 'function') {
				target.forEach(cb, context);
			} else {
				for (var name in target) {
					if (hasOwn.call(target, name)) {
						cb.call(context, target[name], name);
					}
				}
			}
		}
	}

	var defaults = exports.defaults = {
		escape: escape,
		include: null,
		helpers: {},
		each: each
	};

	function prepareTemplate(tmpl, opts) {
		if (!opts) {
			opts = {};
		}

		var escape = opts.escape || defaults.escape;
		var include = opts.include || defaults.include;
		var helpers = opts.helpers || defaults.helpers;
		var each = opts.each || defaults.each;

		function t(it, opts) {
			if (!opts) {
				opts = {};
			}

			return tmpl(
				it,
				opts.escape || escape,
				opts.include || include,
				opts.helpers || helpers,
				opts.each || each
			);
		}
		t.render = t;

		return t;
	}

	exports.prepareTemplate = prepareTemplate;


/***/ }
/******/ ])
});
;