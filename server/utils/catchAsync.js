// Eliminates try/catch boilerplate from every async route handler.
// Any thrown error is forwarded to Express's global error handler.
//
// Usage:
//   router.get("/", catchAsync(async (req, res) => {
//     const data = await SomeModel.find().lean();
//     res.json({ success: true, data });
//   }));

const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = catchAsync;