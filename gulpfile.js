// cSpell:words typescriptifier tsify beepbeep styl

const gulp = require('gulp')
const plumber = require("gulp-plumber")
const concat = require("gulp-concat")
const sequence = require("gulp-sequence")
const rename = require("gulp-rename")
const beep = require("beepbeep")

const browserify = require('browserify')
const tsify = require('tsify')
const babelify = require("babelify")
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')

const tslint = require("gulp-tslint")

const jade = require("gulp-jade")
const declare = require("gulp-declare")

const stylus = require("gulp-stylus")
const autoprefixer = require("gulp-autoprefixer")
const cleanCss = require("gulp-clean-css")

const hash = require("gulp-hash-src")

function errorHandler(err) {
    beep(2)
    console.error(err.toString())
}

gulp.task('ts', function () {
    browserify()
        .add('src/index.ts')
        .plugin(tsify, {})
        .transform(babelify, { extensions: ['.ts'] })
        .bundle()
        .on('error', errorHandler)
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(gulp.dest("build"))
})

gulp.task("tslint", () =>
    gulp.src("src/**/*.ts")
        .pipe(tslint({
            fix: true,
            formatter: "prose",
            program: require('tslint').Linter.createProgram("./tsconfig.json")
        }))
        .pipe(tslint.report({
            emitError: false,
            allowWarnings: true
        }))
);

gulp.task("template", function () {
    gulp.src("src/**/*.jade")
        .pipe(plumber({ errorHandler: errorHandler }))
        .pipe(jade({ client: true }))
        .pipe(declare({ namespace: "ST", noRedeclare: true }))
        .pipe(concat("template.js"))
        .pipe(gulp.dest("build"))
})

const CSS_PREFIX = ["ie >= 8",
    "ie_mob >= 10",
    "ff >= 30",
    "chrome >= 34",
    "safari >= 7",
    "opera >= 23",
    "ios >= 7",
    "android >= 4.4",
    "bb >= 10"]

gulp.task("stylus", function () {
    gulp.src("src/**/*.styl")
        .pipe(plumber({ errorHandler: errorHandler }))
        .pipe(stylus())
        .pipe(autoprefixer(CSS_PREFIX))
        .pipe(cleanCss({ compatibility: "ie8" }))
        .pipe(concat("app.css"))
        .pipe(gulp.dest("build"))
})

gulp.task("index", function () {
    gulp.src("src/index.jade")
        .pipe(plumber({ errorHandler: errorHandler }))
        .pipe(jade({ client: false }))
        .pipe(rename("index-tmp.html"))
        .pipe(gulp.dest("build"))
})

gulp.task("lib", function () {
    gulp.src("lib/**").pipe(gulp.dest("build/lib"))
})

gulp.task("img", function () {
    gulp.src("img/**").pipe(gulp.dest("build/img"))
})

gulp.task("hash", function() {
    return gulp.src(["build/index-tmp.html"])
        .pipe(hash({build_dir: "build", src_path: "src", hash_len: 6}))
        .pipe(rename("index.html"))
        .pipe(gulp.dest("./build"))
})

gulp.task("ts-tslint-hash", function(cb) { sequence("tslint", "ts", "hash")(cb) })
gulp.task("stylus-hash", function(cb) { sequence("stylus", "hash")(cb) })
gulp.task("template-hash", function(cb) { sequence("template", "hash")(cb) })
gulp.task("index-hash", function(cb) { sequence("index", "hash")(cb) })

gulp.task("watch", ["default"], function () {
    gulp.watch('src/**/*.ts', ["ts-tslint-hash"])
    gulp.watch('src/**/*.jade', ["template-hash"])
    gulp.watch('src/**/*.styl', ["stylus-hash"])
    gulp.watch('src/**/*.jade', ["index-hash"])
    gulp.watch('lib/**', ["lib"])
    gulp.watch('img/**', ["img"])
})

gulp.task("default", sequence("tslint", ["index", "ts", "template", "stylus"], ["lib", "img"], "hash"))
