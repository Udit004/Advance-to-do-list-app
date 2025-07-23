// ✅ Simple rate limiting for todo creation
const createTodoRateLimit = {};

const rateLimitMiddleware = (req, res, next) => {
  const userId = req.user._id.toString();
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxRequests = 5; // Max 5 todo creations per 10 seconds
  
  if (!createTodoRateLimit[userId]) {
    createTodoRateLimit[userId] = [];
  }
  
  // Clean old entries
  createTodoRateLimit[userId] = createTodoRateLimit[userId].filter(
    timestamp => now - timestamp < windowMs
  );
  
  if (createTodoRateLimit[userId].length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many todo creation requests. Please wait a moment.",
      error: "RATE_LIMIT_EXCEEDED"
    });
  }
  
  createTodoRateLimit[userId].push(now);
  next();
};

module.exports = rateLimitMiddleware;

// Use this middleware in your route:
// router.post("/:projectId/todos/create", rateLimitMiddleware, createTodoInProject);