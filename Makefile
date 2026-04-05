.PHONY: install build test test-watch lint clean publish

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

clean:
	rm -rf dist node_modules

publish:
	npm publish
