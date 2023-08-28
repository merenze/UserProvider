// middleware/whoamiMiddleware.js

const { default: axios } = require("axios");
const jwt = require("jsonwebtoken");
const { User } = require("../models/");
const handleServerError = require("../utils/handleServerError");

module.exports = {
  // Validate that the Client-Session header is present
  sessionProvided: (req, res, next) => {
    const session = req.get("Client-Session");
    if (session) {
      try {
        req.session = jwt.verify(session, process.env.JWT_KEY);
      } catch (error) {
        res.status(401).json({ message: "Bad token provided." });
      }
      next();
      return;
    }
    res.status(401).json({ message: "Missing required Client-Session header" });
  },

  // Validate that this is a valid session token
  tokenValid: (req, res, next) => {
    if (
      req.session.exp >= new Date().getTime() ||
      req.session.purpose === "Client-Session"
    ) {
      next();
      return;
    }
    res.status(401).json({ message: "Bad token provided." });
  },

  // Validate that the Client-Session header is associated with a user
  // TODO move to userMiddleware
  getUserFromSession: async (req, res, next) =>
    axios
      .get(
        `${process.env.PROTOCOL}://${process.env.APP_URL}:${process.env.PORT}/users/${req.session.sub}`
      )
      .then((response) => {
        if (response.status === 200) {
          req.user = new User(response.data);
          next();
          return;
        }
        res.status(response.status).json(response.data);
      })
      .catch((error) => handleServerError(error, res)),
};
