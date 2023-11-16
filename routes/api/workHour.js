const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

router.post("/", async (req, res) => {
  const { start_time, end_time } = req.body;

  const startTime = new Date(start_time);
  const endTime = new Date(end_time);

  try {
    const upsertWorkHour = await prisma.work_hour.upsert({
      where: {
        id: 1,
      },
      update: {
        start_time: startTime,
        end_time: endTime,
      },
      create: {
        id: 1,
        start_time: startTime,
        end_time: endTime,
      },
    });

    res.status(200).json(upsertWorkHour);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.get("/", async (req, res) => {
  try {
    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    res.status(200).json(workHour);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
