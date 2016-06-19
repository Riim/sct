let runtime = exports.runtime = require('sct-runtime');

let createObject = Object.create;
let getPrototypeOf = Object.getPrototypeOf;
let getObjectKeys = Object.keys;

let reName = '[$_a-zA-Z][$\\w]*';
let rePath = '(\\.?[$_a-zA-Z][$\\w]*(?:\\??\\(\\))*(?:\\??\\.[$_a-zA-Z][$\\w]*(?:\\??\\(\\))*)*)';
let reExpression = '(\\S[\\s\\S]*?)';
let reInsert = RegExp([
	'\\{\\{(?:',
		// 0
		'\\s*' + rePath + '\\s*',
		'|',
		// 1
		'\\{\\s*' + rePath + '\\s*\\}',
		'|',
		// 2
		',\\s*' + reExpression + '\\s*',
		'|',
		// 3
		'\\{,\\s*' + reExpression + '\\s*\\}',
		'|',
		// 4
		';\\s*' + reExpression + '\\s*',
		'|',
		// 5?, 6?, 7?, 8
		'\\?(\\?)?(?:\\s*(?:(!)|(' + reName + ')\\s*=))?\\s*' + rePath + '\\s*',
		'|',
		// 9
		'(\\?)\\?',
		'|',
		// 10
		'(\\/)\\?[\\s\\S]*?',
		'|',
		// 11, 12, 13?
		'~\\s*' + rePath + '\\s*:(' + reName + ')(?:\\s*:(' + reName + '))?\\s*',
		'|',
		// 14
		'(\\/)~[\\s\\S]*?',
		'|',
		// 15, 16?
		'@\\s*(' + reName + ')(?:\\s*:(' + reName + '(?:\\s*:' + reName + ')*))?\\s*',
		'|',
		// 17
		'(\\/)@[\\s\\S]*?',
		'|',
		// '1'.match(/.*?/) -> ['']
		// '1'.match(/(?:.*?)?/) -> [1]
		// '1'.match(/(?:.*?)??/) -> ['']
		// 18, 19, 20?
		'(=|#)\\s*(' + reName + ')(?:\\s+' + reExpression + ')??\\s*',
		'|',
		// 21
		'(\\/)#[\\s\\S]*?',
		'|',
		// 22
		'>\\s*' + reExpression + '\\s*',
		'|',
		'\\/\\/[\\s\\S]*?',
	')\\}\\}'
].join(''));

/**
 * @typesign (tmpl: string, opts?: { collapseWhitespaces: boolean }) -> string;
 */
function templateToFnBodyExpression(tmpl, opts) {
	let state = [];

	let rootScope = createObject(null);
	let scope = rootScope;

	rootScope.it = 'it';
	rootScope.escape = 'escape';
	rootScope.include = 'include';
	rootScope.helpers = 'helpers';
	rootScope.each = 'each';
	rootScope.out = 'out';

	let partials = createObject(null);

	let js = [];

	function push(expr) {
		if (expr == "''") {
			return;
		}

		if (state.length && state[0].type == 'push') {
			if (expr[0] == '\'') {
				let prev = js[js.length - 1];

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

		let delimiter = /\d/.test(variable[variable.length - 1]) ? '_' : '';
		let index = 2;
		let scopedVariable;

		while ((scopedVariable = variable + delimiter + index) in scope) {
			index++;
		}

		rootScope[scopedVariable] = scopedVariable;
		scope[variable] = scopedVariable;

		return scopedVariable;
	}

	function descopifyPath(path) {
		return path.replace(/^[$\w]+/, name => scope[name]);
	}

	function pathToExpression(path, variable) {
		if (path[0] != '.' && !(path.match(/^([$\w]+)/)[1] in scope)) {
			path = '.' + path;
		}

		let fromIt = path[0] == '.';

		path = path.split('?');

		if (path.length == 1) {
			return (variable ? scopifyVariable(variable) + ' = ' : '') +
				(fromIt ? 'it' + path[0] : descopifyPath(path[0]));
		}

		let i;
		let expr;

		if (fromIt || /[^$\w]/.test(path[0])) {
			i = 1;
			expr = ['(temp = ' + (fromIt ? 'it' + path[0] : descopifyPath(path[0])) + ')'];

		// если не fromIt и path[0] не содержит что-то кроме [$\w], т. е.: `name?...`
		} else {
			let descopedFirstPathPart = descopifyPath(path[0]);

			if (path.length == 2) {
				return descopedFirstPathPart + ' && ' + (variable ? '(' + scopifyVariable(variable) + ' = ' : '') +
					descopedFirstPathPart + path[1] + (variable ? ')' : '');
			}

			i = 2;
			expr = [descopedFirstPathPart + ' && (temp = ' + descopedFirstPathPart + path[1] + ')'];
		}

		rootScope.temp = 'temp';

		for (let l = path.length - 1; i < l; i++) {
			expr.push(' && (temp = temp' + path[i] + ')');
		}

		return expr.join('') + ' && ' + (variable ? '(' + scopifyVariable(variable) + ' = ' : '') + 'temp' + path[i] +
			(variable ? ')' : '');
	}

	tmpl = tmpl.split(reInsert);

	for (let i = 0, l = tmpl.length; i < l;) {
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
			} else if (tmpl[i + 8]) {
				endPush();

				let elseIf = tmpl[i + 5];

				if (elseIf) {
					if (!state.length || state[0].type != 'if') {
						throw new SyntaxError("Unexpected token '??'");
					}
				} else {
					state.unshift({ type: 'if' });
					scope = createObject(scope);
				}

				let not = tmpl[i + 6];
				let expr = pathToExpression(tmpl[i + 8], tmpl[i + 7]);

				js.push(
					(elseIf ? ' } else' : '') + ' if (' + (not ? '!' : '') +
						(not && expr.indexOf('&&') != -1 ? '(' + expr + ')' : expr) + ') {'
				);
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

				let valueVariable = tmpl[i + 12];
				let keyVariable = tmpl[i + 13];

				state.unshift({ type: 'for' });

				scope = createObject(scope);
				scope[valueVariable] = valueVariable;
				if (keyVariable) {
					scope[keyVariable] = keyVariable;
				}

				js.push(
					' each(' + pathToExpression(tmpl[i + 11]) + ', function(' +
						valueVariable + (keyVariable ? ', ' + keyVariable : '') + ') {'
				);
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

				let name = tmpl[i + 15];
				let params = tmpl[i + 16] ? tmpl[i + 16].split(/\s*:/) : [];

				state.unshift({ type: 'partial' });

				scope = createObject(scope);

				for (let i = params.length; i;) {
					let param = params[--i];
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
				let type = tmpl[i + 18];
				let name = tmpl[i + 19];
				let params = tmpl[i + 20];

				push(
					(name in partials ? '' : 'helpers.') + name + '.call(it' +
						(type == '=' ? (params ? ', ' + params : '') + ')' : ', (function(out) {')
				);

				if (type == '#') {
					state.unshift({ type: 'call', params: params });
				}
			} else if (tmpl[i + 21]) {
				endPush();

				if (!state.length || state[0].type != 'call') {
					throw new SyntaxError("Unexpected token '/#'");
				}

				let params = state.shift().params;

				js.push(" return out; }).call(it, []).join('')" + (params ? ', ' + params : '') + ')');
			} else if (tmpl[i + 22]) {
				push('include.call(it, ' + tmpl[i + 22] + ')');
			}

			i += 23;
		} else {
			let str = tmpl[i]
				.split('\\').join('\\\\')
				.split('\'').join('\\\'');

			if (opts && opts.collapseWhitespaces === false) {
				str = str
					.split('\r').join('\\r')
					.split('\n').join('\\n');
			} else {
				str = str.replace(/\s+/g, ' ');
			}

			push('\'' + str + '\'');

			i++;
		}
	}

	endPush();

	if (state.length) {
		throw new SyntaxError(
			'Missing "/' + { 'if': '?', 'for': '~', partial: '@', call: '#' }[state[0].type] + '" in compound statement'
		);
	}

	let initiallyDeclaredVariables = ['it', 'escape', 'include', 'helpers', 'each', 'out'];
	let laterDeclaredVariables = getObjectKeys(rootScope)
		.filter(variable => initiallyDeclaredVariables.indexOf(variable) == -1);

	return 'var ' + (laterDeclaredVariables.length ? laterDeclaredVariables.sort().join(', ') + ', ' : '') + 'out = [];'
		+ js.join('') + " return out.join('');";
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
	return runtime.prepareTemplate(
		Function('it, escape, include, helpers, each', templateToFnBodyExpression(tmpl)),
		opts
	);
}

exports.compile = compileTemplate;
