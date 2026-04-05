.PHONY: install build test test-watch lint fmt clean publish

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

publish:
	npm publish
