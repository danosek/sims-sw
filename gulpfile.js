var rename = require("gulp-rename");
var gulp = require('gulp');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var LessPluginAutoPrefix = require('less-plugin-autoprefix');
var pug = require('gulp-pug');
var gulpif = require('gulp-if');
var changed = require('gulp-changed');
var cached = require('gulp-cached');
var browserSync = require('browser-sync').create();
const errorHandler = require('gulp-error-handle');
var filter = require('gulp-filter');
var debug = require('gulp-debug');
var remember = require('gulp-remember');
var autoprefix = new LessPluginAutoPrefix({
	browsers: ["Chrome >= 57", "Edge >= 39", "Safari >= 10", "iOS >= 10", "Opera 50", "Firefox 50"]
});

var path = {
	src: {
		js: 'src/js/**/*.js',
		less: 'src/less/**/*.less',
		less_solo: 'src/less/solo/*.less',
		less_main: 'src/less/*.less',
		img: 'src/img/*.*',
		pug: 'src/pug/**/*.pug',
		pug_includes: 'src/pug/_includes/*.pug',
		pug_main: ['src/pug/**/*.pug', '!src/pug/_includes/*.pug'],
		fonts: 'src/fonts/**/*.*',
		robots: 'src/robots.txt'
	},
	dist: {
		root: 'docs/',
		js: 'docs/js/',
		less: 'docs/css/',
		img: 'docs/img/',
		pug: 'docs/',
		fonts: 'docs/fonts/',
	},
};


gulp.task('less', function (done) {
	return gulp.src(path.src.less_main)
		.pipe(errorHandler())
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('.'))
		.pipe(debug({ title: 'less' }))
		.pipe(gulp.dest(path.dist.less))
		.pipe(browserSync.stream());
	//done();
});

gulp.task('less:solo', function (done) {
	return gulp.src(path.src.less_solo)
		.pipe(errorHandler())

		//only pass unchanged *main* files and *all* the partials
		.pipe(gulpif(global.isWatching, changed('docs', { extension: '.css' })))

		//filter out unchanged partials, but it only works when watching
		.pipe(gulpif(global.isWatching, cached('less:solo')))

		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write('.'))
		.pipe(debug({ title: 'less:solo' }))
		.pipe(remember('less:solo'))

		.pipe(gulp.dest(path.dist.less))
		.pipe(browserSync.stream());
	//done();
});

gulp.task('pug', function (done) {
	return gulp.src(path.src.pug)
		.pipe(errorHandler())

		//only pass unchanged *main* files and *all* the partials
		.pipe(gulpif(global.isWatching, changed('docs', { extension: '.html' })))

		//filter out unchanged partials, but it only works when watching
		.pipe(gulpif(global.isWatching, cached('pug')))

		//filter out partials (folders and files starting with "_" )
		.pipe(filter(function (file) {
			return !/\/_/.test(file.path) && !/^_/.test(file.relative);
		}))

		//.pipe(cached('pug'))
		.pipe(pug({ pretty: true, doctype: 'HTML' }))
		.pipe(debug({ title: 'pug' }))
		.pipe(remember('pug'))

		.pipe(gulp.dest(path.dist.pug))
		.pipe(browserSync.stream());
	//done();
});

gulp.task('js', function (done) {
	return gulp.src(path.src.js)
		.pipe(errorHandler())
		.pipe(gulp.dest(path.dist.js))
	//done();
});

gulp.task('img', function (done) {
	return gulp.src(path.src.img)
		.pipe(errorHandler())
		.pipe(debug({ title: 'IMG' }))
		.pipe(gulp.dest(path.dist.img))
	//.pipe(browserSync.stream());
	//done();
});

gulp.task('fonts', function (done) {
	return gulp.src(path.src.fonts)
		.pipe(errorHandler())
		.pipe(gulp.dest(path.dist.fonts))
	//done();
});


gulp.task('robots', function (done) {
	return gulp.src(path.src.robots)
		.pipe(errorHandler())
		.pipe(gulp.dest(path.dist.root))
	//done();
});


gulp.task('browser-sync', function () {
	browserSync.init({
		server: {
			baseDir: "./docs/index.html",
		},
		browser: "firefox"
	});
});


gulp.task('watch', gulp.parallel('less', 'pug', 'js', 'img', 'fonts', 'less:solo', function () {

	browserSync.init({
		server: './docs',
		browser: "firefox"
	});

	gulp.watch(path.src.less, gulp.parallel('less'));
	gulp.watch(path.src.less_solo, gulp.parallel('less:solo'));
	gulp.watch(path.src.pug, gulp.parallel('pug'));
	gulp.watch(path.src.js, gulp.parallel('js'));
	gulp.watch(path.src.img, gulp.parallel('img'));
	gulp.watch(path.src.fonts, gulp.parallel('fonts'));
	gulp.watch('docs/**/*.html').on('change', browserSync.reload);
	gulp.watch('docs/**/*.css').on('change', browserSync.reload);
}));

gulp.task('setWatch', function (done) {
	global.isWatching = true;
	done();
});

// Tasks

gulp.task('default', gulp.series('setWatch', 'watch'));
gulp.task('build', gulp.series('pug', 'js', 'img', 'fonts', 'less', 'less:solo', 'robots'));