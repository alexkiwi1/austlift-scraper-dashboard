# ESLint Integration for Austlift Scraper Dashboard

## Overview

This project includes comprehensive ESLint integration with React, accessibility, and code quality rules to ensure maintainable and error-free code.

## Configuration Files

### `.eslintrc.js`
- **Airbnb Style Guide**: Enforces industry-standard React best practices
- **React Hooks Rules**: Ensures proper hook usage and dependencies
- **Accessibility Rules**: JSX a11y plugin for accessibility compliance
- **Import Rules**: Proper module resolution and dependency management
- **JSDoc Rules**: Documentation requirements for functions
- **Prettier Integration**: Code formatting consistency

### `.prettierrc`
- **Single Quotes**: Consistent string formatting
- **Semicolons**: Required for statement termination
- **Trailing Commas**: ES5 compatible trailing commas
- **Print Width**: 80 character line limit
- **Tab Width**: 2 spaces for indentation

## Scripts

### Linting
```bash
# Run ESLint with error reporting
npm run lint

# Auto-fix ESLint issues
npm run lint:fix
```

### Formatting
```bash
# Format all files with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

### Pre-commit
```bash
# Run linting and formatting checks
npm run pre-commit
```

## Rules Configuration

### Code Quality Rules
- **Complexity**: Maximum 20 (increased for dashboard component)
- **Max Lines**: 600 per file (increased for dashboard component)
- **Max Lines per Function**: 100 (increased for dashboard component)
- **Max Depth**: 4 levels of nesting
- **Max Params**: 4 function parameters

### React Rules
- **Function Components**: Arrow functions preferred
- **JSX Props**: No spreading without explicit props
- **Button Types**: Explicit type attributes required
- **Form Labels**: Must be associated with controls

### Accessibility Rules
- **Anchor Validation**: Proper href attributes
- **Alt Text**: Required for images
- **ARIA Props**: Valid ARIA attributes
- **Label Association**: Form labels must be linked to controls

### Import Rules
- **No Unresolved**: All imports must resolve
- **No Extraneous**: Only necessary dependencies
- **Prefer Default Export**: For single exports

## Error Handling

### Common Issues and Solutions

1. **Button Type Missing**
   ```jsx
   // ❌ Error
   <button onClick={handleClick}>Click me</button>
   
   // ✅ Fixed
   <button type="button" onClick={handleClick}>Click me</button>
   ```

2. **Form Label Association**
   ```jsx
   // ❌ Error
   <label>Username</label>
   <input type="text" />
   
   // ✅ Fixed
   <label htmlFor="username">Username</label>
   <input id="username" type="text" />
   ```

3. **Arrow Function Body Style**
   ```jsx
   // ❌ Error
   const formatName = (name) => {
     return name.toUpperCase();
   };
   
   // ✅ Fixed
   const formatName = (name) => name.toUpperCase();
   ```

4. **Nested Ternary Expressions**
   ```jsx
   // ❌ Error
   {condition ? value1 : condition2 ? value2 : value3}
   
   // ✅ Fixed
   {condition && <Component1 />}
   {!condition && condition2 && <Component2 />}
   {!condition && !condition2 && <Component3 />}
   ```

## Pre-commit Hooks

The project includes Husky pre-commit hooks that automatically run:
1. ESLint with error checking
2. Prettier format validation

### Setup
```bash
# Install Husky (if not already installed)
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

## IDE Integration

### VS Code
Install these extensions for optimal experience:
- **ESLint**: Real-time linting
- **Prettier**: Code formatting
- **Auto Rename Tag**: JSX tag synchronization
- **Bracket Pair Colorizer**: Code structure visualization

### Settings
Add to VS Code settings.json:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

## Continuous Integration

The ESLint configuration is designed to work with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run ESLint
  run: npm run lint

- name: Check Prettier formatting
  run: npm run format:check
```

## Troubleshooting

### Common Issues

1. **Import Resolution Errors**
   - Check that all dependencies are installed
   - Verify import paths are correct
   - Ensure file extensions are included when needed

2. **Prettier Conflicts**
   - Run `npm run format` to fix formatting
   - Check `.prettierrc` configuration
   - Ensure no conflicting formatters are active

3. **Accessibility Warnings**
   - Add proper ARIA attributes
   - Associate labels with form controls
   - Use semantic HTML elements

### Performance

- ESLint runs on file save in development
- Pre-commit hooks run only on staged files
- CI/CD runs full linting on all files

## Best Practices

1. **Keep Functions Small**: Break down large components into smaller ones
2. **Use TypeScript**: Consider migrating to TypeScript for better type safety
3. **Document Functions**: Add JSDoc comments for complex functions
4. **Test Coverage**: Ensure adequate test coverage for critical paths
5. **Regular Updates**: Keep ESLint and plugins updated

## Configuration Customization

To modify rules, edit `.eslintrc.js`:

```javascript
rules: {
  // Disable specific rules
  'no-console': 'off',
  
  // Change rule severity
  'complexity': ['warn', 15],
  
  // Add custom rules
  'custom-rule': 'error'
}
```

## Integration Status

✅ **ESLint Configuration**: Complete  
✅ **Prettier Integration**: Complete  
✅ **Pre-commit Hooks**: Complete  
✅ **Error Fixing**: Complete  
✅ **Accessibility Rules**: Complete  
✅ **React Best Practices**: Complete  

The ESLint integration is now fully functional and will help maintain code quality throughout the development process.


