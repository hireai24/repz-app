import admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

/**
 * Middleware: Verify Firebase ID token and attach decoded user info to req.user.
 */
const verifyUser = async (req, res, next) => {

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Missing auth token." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.log(error);
    // Error detail intentionally omitted for production safety
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired auth token." });
  }
};

/**
 * Middleware: Requires admin role.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: "User not authenticated." });
  }

  if (req.user.role === "admin") {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, error: "Admin access required." });
};

/**
 * Middleware: Requires Pro or higher (Pro, Elite, Admin).
 */
const requirePro = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: "User not authenticated." });
  }

  const role = req.user.role || "free";
  if (["pro", "elite", "admin"].includes(role.toLowerCase())) {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, error: "Pro access required." });
};

/**
 * Middleware: Requires Elite or higher (Elite, Admin).
 */
const requireEliteOrHigher = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, error: "User not authenticated." });
  }

  const role = req.user.role || "free";
  if (["elite", "admin"].includes(role.toLowerCase())) {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, error: "Elite or admin access required." });
};

export { verifyUser, verifyAdmin, requirePro, requireEliteOrHigher };
