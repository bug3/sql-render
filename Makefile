.PHONY: install build test test-watch lint fmt clean release-patch release-minor release-major publish

install:
	npm install

build:
	npm run build

test:
	npm run test

test-watch:
	npm run test:watch

lint:
	npm run lint

fmt:
	@for f in tests/fixtures/*.sql; do npx sql-formatter --fix "$$f"; done

clean:
	rm -rf dist node_modules

release-patch:
	npm version patch -m "release: %s"
	git push --follow-tags

release-minor:
	npm version minor -m "release: %s"
	git push --follow-tags

release-major:
	npm version major -m "release: %s"
	git push --follow-tags

publish:
	npm publish
