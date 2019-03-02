const dist = `./dist`;
const bundles = {
	['markout:es']: {
		input: `./lib/browser/markout.js`,
	},
	['markout:standalone:es']: {
		input: `./lib/browser/markout.js`,
		output: {dir: '/'},
	},
	['quench:es']: {
		input: {
			markout: `./lib/browser/markout.js`,
			components: `./lib/components.js`,
			helpers: `./lib/helpers.js`,
		},
		external: id => id.includes('../markup/dist/'),
		output: {dir: '/'},
		// preserveModules: true,
	},
};

const defaults = {
	context: 'this',
	// output: {},
	output: {sourcemap: true, preferConst: true},
	root: __dirname,
	base: './dist',
	treeshake: {
		propertyReadSideEffects: false,
		// pureExternalModules: false,
	},
};

const es = (name, naming = '[name].js', bundle = bundles[(name = `${name}:es` in bundles ? `${name}:es` : name)]) =>
	configure(name, 'es', naming, bundle, defaults);
es.m = (name, naming = '[name].m.js') => es(name, naming);
const mjs = (name, naming = '[name].mjs') => es(name, naming);

const umd = (name, naming = '[name].js', bundle = bundles[(name = `${name}:umd` in bundles ? `${name}:umd` : name)]) =>
	configure(name, 'umd', naming, bundle, defaults);

export default [es('markout:standalone'), es.m('quench')];

function configure() {
	const normalize = location => location && String.prototype.replace.call(location, /(:\/{0,3}|)([/]+)/g, '$1/');
	const dirname = dirname => dirname && normalize(`${dirname}/`);
	const resolve = (specifier, referrer = cwd, asURL = referrer && `${referrer}`.includes('://')) =>
		asURL
			? `${new URL(specifier, referrer)}`
			: /^[.]{1,2}[/]/.test(specifier)
			? new URL(specifier, `file:///${referrer || ''}`).pathname
			: `${specifier}`;

	const cwd =
		typeof process === 'object'
			? dirname(process.cwd())
			: typeof location === 'object' && location && location.pathname;

	return (configure = (
		bundle,
		format = 'umd',
		fileNames = '', // entryFileNames, //
		{input, output: {dir: dir = '', name, ...output} = {}, ...options},
		{root, base, ...defaults} = {},
	) => {
		root = root ? dirname(root) : cwd;
		base = base ? dirname(base).replace(root, './') : './dist/';

		const [packageID, buildID] = bundle.split(/:(.*)$/, 2);
		const [
			,
			pathname = '',
			filename = '[name]',
			extension = '[extname]',
		] = /^(.*\/|)([^\/]*?)(\.[^\/]+|[extname]|)$/.exec(fileNames);

		dir = normalize(
			packageID && (!dir || dir.startsWith('./'))
				? resolve(dir || './', `${root}${base.slice(2)}${packageID}/`)
				: resolve(`./${dir || ''}`, `${root}${base.slice(2)}`),
		);

		if (typeof input === 'string') {
			// input = normalize(resolve(input, root));
			const suffix = buildID && format !== buildID ? `.${buildID.replace(/:.*$/, '')}` : '';
			const name = `${packageID || output.name || root.replace(/.*\/([^/]+)\/$/, '$1') || 'bundle'}${suffix}`;
			input = {[name]: input};
		}

		output = {...defaults.output, ...output, dir, format};

		(name = name || packageID) && (output.name = name);

		const entryFileNames = `${filename}${extension}`;
		output.entryFileNames = entryFileNames;

		!options.manualChunks || output.chunkFileNames || (output.chunkFileNames = entryFileNames);

		return {...defaults, ...options, input, output};
	})(...arguments);
}
