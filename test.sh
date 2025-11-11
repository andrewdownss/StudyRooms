#!/bin/bash
# Test runner script - Temporarily disables PostCSS during testing

echo "Running BookingEntity tests..."
mv postcss.config.mjs postcss.config.mjs.temp 2>/dev/null
npm test
TEST_EXIT=$?
mv postcss.config.mjs.temp postcss.config.mjs 2>/dev/null
exit $TEST_EXIT

