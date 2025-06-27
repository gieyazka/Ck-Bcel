const jwt = require("jsonwebtoken");

function verifyToken(token, secret) {
  try {
    // Attempt verification with the first secret
    const decodedToken1 = jwt.verify(token, secret, {
      algorithms: ["HS384"],
    });
    return decodedToken1;
  } catch (error1) {
    throw error1;
  }
}

module.exports = { verifyToken };
