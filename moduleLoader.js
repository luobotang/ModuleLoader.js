/*
 * ModuleLoader.js
 * 加载“模块”
 *
 * 用法：
 * - config(options): 配置模块加载器
 * - load(modules, callback): 加载一系列模块（js或css文件），完成后执行回调函数
 *
 * author: luobtang
 * project: https://github.com/luobotang/ModuleLoader.js
 */
(function (factory) {

	// 作为独立部件的内部加载器使用时，替换这里的全局变量名称
	// 使用不易冲突的内部名称吧
	window.ModuleLoader = factory(document);

})(function (document) {

	var baseUrl,
		paths = {},
		hasOwn = Object.prototype.hasOwnProperty;

	/**
	 * config({
	 *   baseUrl: 'http://192.168.1.1/js/',
	 *   paths: {
	 *     jquery: '../lib/jquery.min',
	 *     jmod1: 'mod1'
	 * }});
	 */
	function config(options) {
		if (typeof options.baseUrl === 'string') {
			baseUrl = options.baseUrl;
			if (baseUrl.length > 0 && baseUrl.substr(-1) != '/') {
				baseUrl += '/';
			}
		}
		if (options.paths) {
			for (var path in options.paths) {
				if (hasOwn.call(options.paths, path)) {
					paths[path] = options.paths[path];
				}
			}
		}
	}

	/* load([
	 *   'mod1', // 解析为 <baseUrl>/mod1.js
	 *   'http://192.168.1.1/mod2', // http://192.168.1.1/mod2.js
	 *   'style.css' // <baseUrl>/style.css
	 * ], function () { });
	 */
	function load(modules, callback) {
		var num = 0;

		function onLoad() {
			num--;
			if (num <= 0 && typeof callback === 'function') {
				callback();
			}
		}

		for (var i = 0, module, ext, len = modules.length; i < len; i++) {
			module = normalizePath(modules[i]);
			if (module.slice(-4).toLowerCase() === '.css') {
				loadCSS(module);
			} else {
				if (module.slice(-3).toLowerCase() !== '.js') {
					module += '.js';
				}
				num++;
				loadJS(module, onLoad);
			}
		}
	}

	function normalizePath(file) {
		file = paths[file] || file;
		if (!file.match(/^http[s]:/i)) {
			file = baseUrl + file;
			file = file.split('/');
			trimDots(file);
			file = file.join('/');
		}
		return file;
	}

	function loadJS(file, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = file;
		script.charset = 'utf-8';
		script.async = true;
		if (typeof callback === 'function') {
			if (document.all) {
				// 根据 RequireJS 源码中的注释，貌似没有办法处理，低版本IE下 onreadystatechange
				// 会比错误事件先触发，所以绑定了也没有用....
				script.onreadystatechange = function () {
					if (script.readyState == 'loaded' || script.readyState == 'complete') {
						callback();
					}
				}
			} else {
				script.onload =  callback;
			}
		}
		var ref = document.getElementsByTagName('script')[0];
		ref.parentNode.insertBefore(script, ref);
	}

	function loadCSS(url, callback) {
		var link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = url;

		var ref = document.getElementsByTagName('script')[0];
		ref.parentNode.insertBefore(link, ref);

		// 实用但不优雅的方式，尽量不用
		if (typeof callback === 'function') {
			var img = document.createElement('img');
			img.onerror = callback;
			img.src = url;
		}
	}

	function getCurrentScriptPath() {
		var scripts = document.getElementsByTagName("script");
		return scripts[scripts.length - 1].getAttribute("src") || '';
	}

	// copy from RequireJS
	function trimDots(ary) {
		var i, part;
		for (i = 0; i < ary.length; i++) {
			part = ary[i];
			if (part === '.' || part === '') {
				ary.splice(i, 1);
				i -= 1;
			} else if (part === '..') {
				if (i === 0 || (i == 1 && ary[2] === '..') || ary[i - 1] === '..') {
					continue;
				} else if (i > 0) {
					ary.splice(i - 1, 2);
					i -= 2;
				}
			}
		}
	}

	function getInitBasePath() {
		var path = getCurrentScriptPath(),
			index = path.lastIndexOf('/');
		if (index === -1) {
			return '';
		} else {
			return path.substr(0, index + 1);
		}
	}

	// 初始设置路径
	baseUrl = getInitBasePath();

	return {
		config: config,
		load: load
	};
});