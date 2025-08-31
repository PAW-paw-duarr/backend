import { Request, Response, NextFunction } from "express";
import createError from "http-errors";

export function getHome(req: Request, res: Response, next: NextFunction) {
  try {
    res.send("Welcome to Express w/ Typescript!");
  } catch (err) {
    next(createError(500, "Internal server error, try again"));
  }
};
