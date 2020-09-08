# 3.23.1 / 2020-06-11

- change: removed extra check when humanizing Arabic
- change: simplify logic for Latvian

# 3.23.0 / 2020-05-21

- new: Swahili support

# 3.22.0 / 2020-02-28

- new: Hebrew support

# 3.21.0 / 2019-09-26

- new: Færøsk support

# 3.20.1 / 2019-07-28

- fix: if `decimal` is missing in a language, use `.` (see [#160](https://github.com/EvanHahn/HumanizeDuration.js/issues/160))

# 3.20.0 / 2019-07-17

- new: Latvian support
- fix: better handle properties that happen to also be on `Object.prototype`

# 3.19.0 / 2019-07-08

- new: Estonian support

# 3.18.0 / 2019-03-07

- new: `maxDecimalPoints` option

# 3.17.0 / 2019-01-06

- new: `fallbacks` option

# 3.16.0 / 2018-12-01

- new: Romanian support
- new: Thai support

# 3.15.3 / 2018-09-18

- fix: Greek should be `el`, not `gr`

# 3.15.2 / 2018-09-12

- fix: corrections for Arabic

# 3.15.1 / 2018-07-15

- fix: corrections for Croatian

# 3.15.0 / 2018-06-12

- new: Croatian support
- new: Lao support

# 3.14.0 / 2018-03-23

- new: Urdu support

# 3.13.0 / 2018-03-19

- new: Slovak support

# 3.12.1 / 2018-01-03

- fix: Ukranian translation for weeks was incorrect

# 3.12.0 / 2017-11-07

- new: Bulgarian support

# 3.11.0 / 2017-10-25

- new: Persian/Farsi support

# 3.10.1 / 2017-07-21

- fix: use singular form from -2 to 2 in French

# 3.10.0 / 2016-11-29

- new: Icelandic support

# 3.9.1 / 2016-07-24

- fix: Russian and Ukranian fixes

# 3.9.0 / 2016-06-10

- new: Indonesian support
- new: Malay support

# 3.8.0 / 2016-05-19

- new: `conjunctions` and `serialComma` options

- update: improve documentation

# 3.7.1 / 2016-04-26

- fix: rounding had some more errors

# 3.7.0 / 2016-03-18

- new: Vietnamese support

# 3.6.1 / 2016-02-19

- update: readme should use single quotes

- fix: rounding had some errors (for example, you could get "1 day, 24 hours")
- fix: readme example was missing some quotes in its result

# 3.6.0 / 2016-02-12

- new: Lithuanian support

- fix: add trailing semicolon to improve concatenation with other libraries

# 3.5.0 / 2016-01-13

- new: Finnish support
- new: recommend [millisec](https://github.com/sungwoncho/millisec) module in readme

# 3.4.0 / 2015-12-11

- new: Czech support

- update: minor performance improvements
- update: add "related modules" section to readme

- fix: add Greek to readme

# 3.3.0 / 2015-08-05

- new: `unitMeasures` option

# 3.2.1 / 2015-07-22

- fix: document `largest` option

# 3.2.0 / 2015-07-15

- new: Ukrainian support

- fix: things would break in global strict mode

# 3.1.0 / 2015-06-25

- new: Greek support

# 3.0.0 / 2015-05-29

- new: `largest` option to get largest units

- update: languages can change decimal point (which can be overridden)
- update: fix some unintuitive `round` behavior
- update: specify units in shorthand rather than longhand
- update: use the Unlicense
- update: `nob` is now `no`
- update: use underscores instead of dashes for Chinese

- remove: half units

# 2.8.0 / 2015-05-10

- new: `getSupportedLanguages`

# 2.7.0 / 2015-05-08

- new: changelog
- new: Arabic support
- new: Italian support

- remove: (spoken) languages from package.json keywords
