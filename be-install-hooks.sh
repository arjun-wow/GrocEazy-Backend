#!/bin/bash

echo "Installing dev dependencies for backend JS project..."

npm install --save-dev \
  husky lint-staged eslint prettier \
  @commitlint/cli @commitlint/config-conventional \
  eslint-plugin-sonarjs depcheck

echo "Adding prepare script to package.json..."
npm pkg set scripts.prepare="husky install"

echo "Setting up Husky manually..."
mkdir -p .husky
git config core.hooksPath .husky

# Create shared husky loader
mkdir -p .husky/_
cat <<'EOF' > .husky/_/husky.sh
#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }
  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi
  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi
fi
EOF
chmod +x .husky/_/husky.sh

# Create pre-commit hook
cat <<'EOF' > .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOF
chmod +x .husky/pre-commit

# Create commit-msg hook
cat <<'EOF' > .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
EOF
chmod +x .husky/commit-msg

echo "Creating ESLint config for backend JS project..."
cat <<EOF > .eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:sonarjs/recommended',
    'prettier'
  ],
  plugins: ['sonarjs'],
  rules: {
    complexity: ['warn', { max: 10 }],
    'max-lines': ['warn', 300],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4]
  }
};
EOF

echo "Creating Prettier config..."
cat <<EOF > .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
EOF

echo "Creating commitlint config..."
cat <<EOF > .commitlintrc.json
{
  "extends": ["@commitlint/config-conventional"]
}
EOF

echo "Creating lint-staged config..."
cat <<EOF > .lintstagedrc.json
{
  "*.js": ["eslint --fix", "prettier --write"],
  "*.json": ["prettier --write"]
}
EOF

echo "Creating VSCode workspace settings..."
mkdir -p .vscode
cat <<EOF > .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"],
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true
  },
  "prettier.requireConfig": true
}
EOF

echo "Updating .gitignore..."
touch .gitignore
grep -qxF '.vscode/' .gitignore || echo '.vscode/' >> .gitignore
grep -qxF '*.log' .gitignore || echo '*.log' >> .gitignore

echo "Adding recommended NPM scripts..."
npx npm pkg set scripts.lint="eslint ."
npx npm pkg set scripts.format="prettier --write ."
npx npm pkg set scripts.unused:deps="depcheck"

echo "Pre-commit setup completed successfully!"
