const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Create holiday
router.post("/", async (req, res) => {
  const { name, startDate, endDate } = req.body;

  const formatStartDate = new Date(startDate);
  const formatEndDate = new Date(endDate);

  try {
    const createHoliday = await prisma.holiday.create({
      data: {
        name: name,
        start_date: formatStartDate,
        end_date: formatEndDate,
      },
    });

    res
      .status(201)
      .json({ status: 200, message: "Record has been created", createHoliday });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all holidays
router.get("/", async (req, res) => {
  const allHolidays = await prisma.holiday.findMany({});

  res.status(200).json(allHolidays);
});

// Read single holiday
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleHoliday = await prisma.holiday.findUnique({
      where: {
        id: id,
      },
    });

    if (singleHoliday == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleHoliday);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update holiday info
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, startDate, endDate } = req.body;

  try {
    const editHoliday = await prisma.holiday.update({
      where: {
        id: id,
      },
      data: {
        name: name || undefined,
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editHoliday,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete holiday info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleHoliday = await prisma.holiday.delete({
      where: {
        id: id,
      },
    });

    res
      .status(200)
      .json({ status: 200, message: `Record id ${id} successfully deleted` });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
