import express, { type RequestHandler } from "express";
import * as userService from "../services/userService.js";

const router = express.Router();

// GET /api/user/:id
const getUserById: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
router.get("/:id", getUserById);

// PUT /api/user/:id
const updateUser: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
router.put("/:id", updateUser);

// DELETE /api/user/:id
const deleteUser: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};
router.delete("/:id", deleteUser);

// GET /api/user (short)
const listUsersShort: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userService.getAllUsersShort();
    res.json(users);
  } catch (err) {
    next(err);
  }
};
router.get("/", listUsersShort);

export default router;
