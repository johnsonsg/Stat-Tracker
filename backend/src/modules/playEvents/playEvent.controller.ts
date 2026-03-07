import type { Request, Response } from "express";
import { listPlayEvents } from "./playEvent.service";

export async function listPlayEventsHandler(_req: Request, res: Response) {
  return res.json(listPlayEvents());
}
