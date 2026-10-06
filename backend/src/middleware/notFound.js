const notFound = (req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: `Route ${req.method} ${req.originalUrl} not found` }
  });
};

module.exports = notFound;
