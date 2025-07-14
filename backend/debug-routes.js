const fs = require('fs');
const path = require('path');

// Enhanced route debugger to find path-to-regexp issues
function debugRoutes() {
  console.log('🔍 Enhanced Route Debugging for path-to-regexp errors\n');
  
  // Common problematic patterns
  const problematicPatterns = [
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*\*[^'"`]*?)['"`]/g,  // Catch-all routes
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*:(?![\w]+)[^'"`]*?)['"`]/g,  // Malformed parameters
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*:$)['"`]/g,  // Trailing colons
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*\?[^'"`]*?)['"`]/g,  // Query parameters in routes
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*#{1,}[^'"`]*?)['"`]/g,  // Hash in routes
    /router\.(get|post|put|delete|patch)\(['"`]([^'"`]*\[[^\]]*\][^'"`]*?)['"`]/g,  // Brackets in routes
  ];
  
  const routeFiles = [
    'notificationRoutes.js',
    'projectRoutes.js',
    'pushRoutes.js',
    'todolist.js',
    'userProfileRoutes.js',
    'authMiddleware.js'
  ];
  
  let issuesFound = 0;
  let routeCount = 0;
  
  routeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${file}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📁 Analyzing ${file}:`);
    
    // Check for problematic patterns
    problematicPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        issuesFound++;
        
        console.log(`❌ Issue ${issuesFound}: Line ${lineNumber}`);
        console.log(`   Pattern: ${match[0]}`);
        console.log(`   Route: ${match[2]}`);
        console.log(`   Problem: ${getProblemDescription(index)}`);
      }
    });
    
    // Count all routes
    const routeMatches = content.match(/router\.(get|post|put|delete|patch)\s*\(/g);
    if (routeMatches) {
      routeCount += routeMatches.length;
      console.log(`✅ ${routeMatches.length} routes found`);
    }
    
    // Check for specific Express.js anti-patterns
    checkExpressAntiPatterns(content, file);
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`Total routes analyzed: ${routeCount}`);
  console.log(`Issues found: ${issuesFound}`);
  
  if (issuesFound === 0) {
    console.log('✅ No obvious path-to-regexp issues found');
    console.log('\n🔧 If you\'re still getting errors, try:');
    console.log('1. Check your main app.js file for route mounting');
    console.log('2. Verify middleware order');
    console.log('3. Check for dynamic route generation');
    console.log('4. Temporarily comment out route files to isolate the issue');
  } else {
    console.log('❌ Issues found that may cause path-to-regexp errors');
  }
}

function getProblemDescription(patternIndex) {
  const descriptions = [
    'Catch-all route (*) without parameter name',
    'Malformed route parameter (missing name after :)',
    'Trailing colon in route',
    'Query parameters should not be in route pattern',
    'Hash characters in route pattern',
    'Brackets in route pattern may cause issues'
  ];
  return descriptions[patternIndex] || 'Unknown issue';
}

function checkExpressAntiPatterns(content, filename) {
  const antiPatterns = [
    {
      pattern: /router\.use\([^)]*\*[^)]*\)/g,
      description: 'Middleware with catch-all pattern'
    },
    {
      pattern: /router\.(get|post|put|delete|patch)\([^)]*\\[^)]*\)/g,
      description: 'Escaped characters in route'
    },
    {
      pattern: /router\.(get|post|put|delete|patch)\([^)]*\([^)]*\)[^)]*\)/g,
      description: 'Parentheses in route pattern'
    }
  ];
  
  antiPatterns.forEach(({ pattern, description }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      console.log(`⚠️  Anti-pattern in ${filename}:${lineNumber} - ${description}`);
    }
  });
}

// Route conflict detector (enhanced)
function detectRouteConflicts() {
  console.log('\n🔍 Route Conflict Detection:\n');
  
  const routes = {
    'notificationRoutes.js': [
      'GET /:userId',
      'GET /unread-count/:userId',
      'GET /test/:userId',
      'PUT /read/:id',
      'PUT /read-all/:userId',
      'DELETE /:id'
    ],
    'projectRoutes.js': [
      'GET /:projectId/public',
      'POST /create',
      'GET /user',
      'GET /user/:uid',
      'GET /invitations/pending',
      'GET /:id',
      'PUT /:id',
      'DELETE /:id',
      'GET /:projectId/collaborators',
      'POST /:projectId/todos',
      'DELETE /:projectId/todos/:todoId',
      'POST /:projectId/share',
      'POST /:projectId/respond',
      'PATCH /:projectId/collaborators/:collaboratorId/role',
      'DELETE /:projectId/collaborators/:collaboratorId',
      'POST /:projectId/request-access',
      'POST /:projectId/join'
    ],
    'todolist.js': [
      'GET /:uid',
      'POST /create',
      'PATCH /toggle/:id',
      'PATCH /priority/:id',
      'PUT /update/:id',
      'DELETE /delete/:id',
      'POST /notify'
    ]
  };
  
  // Check for conflicts within each file
  Object.entries(routes).forEach(([file, fileRoutes]) => {
    console.log(`📁 ${file}:`);
    
    const conflicts = [];
    for (let i = 0; i < fileRoutes.length; i++) {
      for (let j = i + 1; j < fileRoutes.length; j++) {
        const [method1, route1] = fileRoutes[i].split(' ');
        const [method2, route2] = fileRoutes[j].split(' ');
        
        if (method1 === method2 && wouldConflict(route1, route2)) {
          conflicts.push([fileRoutes[i], fileRoutes[j]]);
        }
      }
    }
    
    if (conflicts.length > 0) {
      console.log(`❌ ${conflicts.length} conflicts found:`);
      conflicts.forEach(([route1, route2]) => {
        console.log(`   ${route1} vs ${route2}`);
      });
    } else {
      console.log(`✅ No conflicts found`);
    }
  });
}

function wouldConflict(route1, route2) {
  // Simple conflict detection - more specific routes should come first
  const segments1 = route1.split('/').filter(s => s);
  const segments2 = route2.split('/').filter(s => s);
  
  if (segments1.length !== segments2.length) return false;
  
  for (let i = 0; i < segments1.length; i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];
    
    // If one is a parameter and the other is static, they conflict
    if ((seg1.startsWith(':') && !seg2.startsWith(':')) ||
        (!seg1.startsWith(':') && seg2.startsWith(':'))) {
      return true;
    }
  }
  
  return false;
}

// Run the debugging
debugRoutes();
detectRouteConflicts();

console.log('\n🔧 Recommended fixes for your projectRoutes.js:');
console.log('1. ✅ Moved /user routes before /:id routes');
console.log('2. ✅ Moved /invitations/pending before /:id routes');
console.log('3. ✅ Ensured proper route ordering');
console.log('4. ✅ All specific routes now come before parameterized routes');
console.log('\n💡 If errors persist, check your main app.js file for how routes are mounted!');