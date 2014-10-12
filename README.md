# gulp-check-unused-css

[![Build Status](http://img.shields.io/travis/zalando/gulp-check-unused-css.svg)](https://travis-ci.org/zalando/gulp-check-unused-css)

Check if all your defined CSS classes are used in your HTML files and vice versa.

## WAT?

Consider this picture:

![Explanation](explanation.svg)

Figure a) represents what you have now. Some classes are defined in your CSS, but never used in the templates. Some classes used in the templates don't appear in your CSS.

Figure b) represents what you actually want. Keeping your CSS and HTML clean improves maintainability of your code. Also you do not send useless bytes to your users, which makes your site loading (slightly, but still) faster.

``gulp-check-unused-css``, even though the name is misleading now, will check for the not overlapping parts of figure a) and throw an error if it encounters them.

## Installation

    npm install --save-dev gulp-check-unused-css

## Usage

Simple use:

    var checkCSS = require( 'gulp-check-unused-css' );
    gulp
        .src([ 'styles/*.css', 'templates/*.html' ])
        .pipe( checkCSS() );

For advanced use with ``gulp-watch`` check out the [Gulpfile](Gulpfile.js).

![Screenshot](screenshot.png)

The plugin will emit all files you put in (because it has to read all of them before checking), but occasionally break your pipe. This is good for automated build processes, e.g. in CI systems like Jenkins or Travis.

## Options

* ``ignore``: Array containing strings and/or regexes, if an unused class matches one of it, it is ignored.
* ``globals``: Predefined sets of ignored classes.
* ``angular``: Boolean, passing ``true`` will turn the support for ``ng-class`` on.


## Ignoring classes

This plugin is inspired by the workflow at Github, where a build fails if the classes used in the CSS and the templates do not overlap exactly. However, most of us do not write 100 % of the CSS ourselves but rely on frameworks such as Bootstrap. That's why there are some options available to ignore "global" or "vendor" classes.

You can provide a list of class names or regular expressions that should be ignored.

    gulp
        .src( 'app.*' )
        .pipe( checkCSS({
            ignore: [ 'special-js-class', /^vendor-/ ]
        }));

Since 1.1.0 you can also add ``globals: [ 'framework@{version}' ]`` to your options.

    gulp
        .src( 'app.*' )
        .pipe( checkCSS({
            globals: [ 'bootstrap@3.2.0' ]
        }));

### Supported globals

* Bootstrap 3.2.0 (``bootstrap@3.2.0``)

## Development

    git clone gulp-check-unused-css
    cd gulp-check-unused-css
    npm install
    # hack hack hack
    npm test

### Add a global

0. Fork the project
1. Acquire CSS file
2. ``cd gulp-check-unused-css``
3. ``node util/extract.js --file { path to CSS file }``
4. Now there is a ``.ignore`` file which is actually a CommonJS module exporting all CSS classes in the file
5. Rename it appropriately to ``{framework}@{version}.js``
6. Save it to ``src/global``
7. Commit and submit a Pull Request

## Changelog

