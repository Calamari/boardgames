TESTS = $(shell find test -name "*test.js")

test:
	NODE_ENV=test ./node_modules/.bin/mocha --reporter list $(TESTS)

.PHONY: test
