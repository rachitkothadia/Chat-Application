import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days (in milliseconds)
    httpOnly: true, // Prevents access to the cookie via JavaScript (helps protect against XSS)
    sameSite: "strict", // CSRF protection - prevents sending cookies with cross-origin requests
    secure: process.env.NODE_ENV === "production", // Only use secure cookies in production (https)
  });

  return token; // Returning token if you need to do something else with it elsewhere
};
