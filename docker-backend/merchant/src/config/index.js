module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '24h',
  port: process.env.PORT || 3000
}; 