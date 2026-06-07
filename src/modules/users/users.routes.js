const { Router } = require("express");
const usersController = require("./users.controller.js");
const { verifyToken } = require("../../middlewares/auth.middleware.js");

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   post:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [host, attendee]
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects to /profile on success
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already taken
 *       500:
 *         description: Internal server error
 */
router.post("/profile", verifyToken, usersController.updateProfile);

/**
 * @swagger
 * /api/users/profile/delete:
 *   post:
 *     summary: Delete user profile and account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to / on success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/profile/delete", verifyToken, usersController.deleteProfile);

module.exports = router;
