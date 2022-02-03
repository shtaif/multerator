# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.10.0](https://github.com/shtaif/multerator/compare/v0.9.0...v0.10.0) (2022-02-03)


### Features

* improve importability - normal "default"-ish way to import both from TS and from JS  ([#42](https://github.com/shtaif/multerator/issues/42)) ([671b819](https://github.com/shtaif/multerator/commit/671b8191733b7488c706ced35672eb40fb856148))

## [0.9.0](https://github.com/shtaif/multerator/compare/v0.8.0...v0.9.0) (2021-11-26)


### Features

* support more accepted input types ([#36](https://github.com/shtaif/multerator/issues/36)) ([122520b](https://github.com/shtaif/multerator/commit/122520bfbbc834a2965e7d47d543db6d4267b3d6))

## [0.8.0](https://github.com/shtaif/multerator/compare/v0.7.0...v0.8.0) (2021-10-31)


### ⚠ BREAKING CHANGES

* output streams instead of async iterables (#34)

### Features

* output streams instead of async iterables ([#34](https://github.com/shtaif/multerator/issues/34)) ([84ab352](https://github.com/shtaif/multerator/commit/84ab3520f8120ab3754906283dacc65a979e1b6c))

## [0.7.0](https://github.com/shtaif/multerator/compare/v0.6.0...v0.7.0) (2021-10-02)


### ⚠ BREAKING CHANGES

* **header size limit:** make header section max size restriction be an internal constant with reasonable value rather than be provided by users (#33)

### Features

* **header size limit:** make header section max size restriction be an internal constant with reasonable value rather than be provided by users ([#33](https://github.com/shtaif/multerator/issues/33)) ([ed319d1](https://github.com/shtaif/multerator/commit/ed319d14c072f8384c1a643d3b42848383ea889f))

## [0.6.0](https://github.com/shtaif/multerator/compare/v0.5.2...v0.6.0) (2021-09-14)


### ⚠ BREAKING CHANGES

* content disposition header is now mandatory (#29)

### Features

* accept incoming part headers case-insensitively per spec ([#31](https://github.com/shtaif/multerator/issues/31)) ([54c06c4](https://github.com/shtaif/multerator/commit/54c06c4fa0a5c57c3da6fc27a040cf504c7c7216))
* content disposition header is now mandatory ([#29](https://github.com/shtaif/multerator/issues/29)) ([5e5a401](https://github.com/shtaif/multerator/commit/5e5a4012c43e65fe240528ed31688d12509550c0))


### Bug Fixes

* **part-info-headers:** fix error while parsing a part with empty headers ([#27](https://github.com/shtaif/multerator/issues/27)) ([7c5ad26](https://github.com/shtaif/multerator/commit/7c5ad26f70607da41f3cda8e4223ca61f6dd7b31))

### [0.5.2](https://github.com/shtaif/multerator/compare/v0.5.1...v0.5.2) (2021-09-04)


### Bug Fixes

* **supported-node-versions:** fix supported node version range from ">=10.15.0" to ">=10.21.0" ([#23](https://github.com/shtaif/multerator/issues/23)) ([971936a](https://github.com/shtaif/multerator/commit/971936a3da298c86f2b506213afc0e5b6b16838f))

### [0.5.1](https://github.com/shtaif/multerator/compare/v0.5.0...v0.5.1) (2021-09-04)

## [0.5.0](https://github.com/shtaif/multerator/compare/v0.4.1...v0.5.0) (2021-09-04)


### ⚠ BREAKING CHANGES

* **limits:** remove default limits for now (#21)

### Features

* **limits:** remove default limits for now ([#21](https://github.com/shtaif/multerator/issues/21)) ([ec08893](https://github.com/shtaif/multerator/commit/ec08893ce5cfa5de7fbb999006d6bbfc55bf6fac))

### [0.4.1](https://github.com/shtaif/multerator/compare/v0.4.0...v0.4.1) (2021-08-13)


### Bug Fixes

* parts can only be resolved one by one ([#18](https://github.com/shtaif/multerator/issues/18)) ([d449ced](https://github.com/shtaif/multerator/commit/d449cedc376354c330433572b6ac24217614bd4a))

## [0.4.0](https://github.com/shtaif/multerator/compare/v0.3.0...v0.4.0) (2021-08-10)


### ⚠ BREAKING CHANGES

* **size-limits:** improve semantics size limit errors specifically about part bodies (#17)

### Features

* **size-limits:** improve semantics size limit errors specifically about part bodies ([#17](https://github.com/shtaif/multerator/issues/17)) ([00c7d2d](https://github.com/shtaif/multerator/commit/00c7d2d26ae2ede006c3cd96d9fc6a3dd6840784))

## [0.3.0](https://github.com/shtaif/multerator/compare/v0.2.0...v0.3.0) (2021-08-10)


### Features

* **size-limits:** implement max size limiting in part header parsing ([#14](https://github.com/shtaif/multerator/issues/14)) ([e475927](https://github.com/shtaif/multerator/commit/e47592714c2bf111d58b7d67bc364b7dc6ef7444))

## [0.2.0](https://github.com/shtaif/multerator/compare/v0.1.1...v0.2.0) (2021-08-07)


### Features

* include original part's headers in each iteration ([#13](https://github.com/shtaif/multerator/issues/13)) ([8e65bfc](https://github.com/shtaif/multerator/commit/8e65bfc63dcb717533f1ecc725772b65bf778340))

### 0.1.1 (2021-08-07)


### Bug Fixes

* **error msg:** fix part of ERR_MISSING_PART_HEADERS_BODY_DELIMITER's message not displaying correctly ([#10](https://github.com/shtaif/multerator/issues/10)) ([796769f](https://github.com/shtaif/multerator/commit/796769f6046574bc1d443399f0110c524b69274a))
