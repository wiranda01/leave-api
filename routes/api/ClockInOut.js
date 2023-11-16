const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const moment = require("moment");

const prisma = require("../../client");

// Function to calculate total hours for clock in and out
const calculateTotalHours = async (clockIn, clockOut, id) => {
  if (clockIn && clockOut) {
    var startTime = new moment(new Date(clockIn));
    var endTime = new moment(new Date(clockOut));
    var duration = moment.duration(endTime.diff(startTime));

    return (totalHours = duration.asHours());
  } else if (clockIn || clockOut) {
    var getClockInOutValue = await prisma.time_record.findUnique({
      where: {
        id: id,
      },
      select: {
        clock_in: true,
        clock_out: true,
      },
    });

    if (clockIn) {
      var clockOut = getClockInOutValue.clock_out;
    } else {
      var clockIn = getClockInOutValue.clock_in;
    }

    var startTime = new moment(new Date(clockIn));
    var endTime = new moment(new Date(clockOut));
    var duration = moment.duration(endTime.diff(startTime));

    return (totalHours = duration.asHours());
  } else {
    return undefined;
  }
};

// Create clock in and out
router.post("/", async (req, res) => {
  const { empId, date, clockIn, clockOut } = req.body;

  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const findRecord = await prisma.time_record.findFirst({
      where: {
        emp_id: parseInt(empId),
        date: { gte: startDate, lt: endDate },
      },
    });

    if (findRecord) {
      res.status(400).json({ message: "User already clock in" });
      return;
    }

    const createTimeRecord = await prisma.time_record.create({
      data: {
        emp_id: parseInt(empId),
        date: new Date(date),
        clock_in: clockIn ? new Date() : undefined,
        clock_out: clockOut ? new Date() : undefined,
        total_hours:
          clockIn && clockOut
            ? await calculateTotalHours(clockIn, clockOut)
            : undefined,
      },
    });

    res.status(201).json({
      status: 201,
      message: "Record has been created",
      createTimeRecord,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all clock in and out
router.get("/", async (req, res) => {
  const { q } = req.query;
  const date = q ? new Date(q) : new Date();

  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const allTimeRecords = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        time_record: {
          where: {
            date: { gte: startDate, lt: endDate },
          },
          include: {},
        },
      },
    });

    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    if (!workHour) {
      for (let timeRecord of allTimeRecords) {
        timeRecord.late_time = new Date(0);
      }
      return res.status(200).json(allTimeRecords);
    }

    for (let timeRecord of allTimeRecords) {
      const startTime = new Date(workHour.start_time);

      const clockIn =
        timeRecord.time_record.length > 0
          ? new Date(timeRecord.time_record[0].clock_in)
          : startTime;

      clockIn.setFullYear(1970);
      clockIn.setMonth(0);
      clockIn.setDate(1);

      startTime.setFullYear(1970);
      startTime.setMonth(0);
      startTime.setDate(1);

      const diffTime = clockIn - startTime;

      if (diffTime > 0) {
        timeRecord.late_time = new Date(diffTime);
      } else {
        timeRecord.late_time = new Date(0);
      }
    }

    res.status(200).json(allTimeRecords);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.get("/dep/:dep_id", async (req, res) => {
  const dep_id = parseInt(req.params.dep_id);

  const date = new Date();
  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const allTimeRecords = await prisma.employee.findMany({
      where: {
        dep_id: dep_id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        time_record: {
          where: {
            date: { gte: startDate, lt: endDate },
          },
          include: {},
        },
      },
    });

    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    if (!workHour) {
      for (let timeRecord of allTimeRecords) {
        timeRecord.late_time = new Date(0);
      }
      return res.status(200).json(allTimeRecords);
    }

    for (let timeRecord of allTimeRecords) {
      const startTime = new Date(workHour.start_time);

      const clockIn =
        timeRecord.time_record.length > 0
          ? new Date(timeRecord.time_record[0].clock_in)
          : startTime;

      // Set the year to 1970
      clockIn.setFullYear(1970);

      // Set the month to 01 (months are zero-based in JavaScript, so January is 0)
      clockIn.setMonth(0);

      // Set the day to 01
      clockIn.setDate(1);
      const diffTime = clockIn - startTime;

      if (diffTime > 0) {
        timeRecord.late_time = new Date(diffTime);
      } else {
        timeRecord.late_time = new Date(0);
      }
    }

    res.status(200).json(allTimeRecords);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read single clock in and out
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleTimeRecord = await prisma.time_record.findUnique({
      where: {
        id: id,
      },
    });

    if (singleTimeRecord == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleTimeRecord);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.get("/employee/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const timeRecords = await prisma.time_record.findMany({
      where: {
        emp_id: id,
      },
      select: {
        id: true,
        emp: {
          select: {
            first_name: true,
            last_name: true,
            dep: true,
          },
        },
        date: true,
        clock_in: true,
        clock_out: true,
        total_hours: true,
      },
    });

    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    if (!workHour) {
      for (let timeRecord of timeRecords) {
        timeRecord.late_time = new Date(0);
      }
      return res.status(200).json(timeRecords);
    }

    for (let timeRecord of timeRecords) {
      const startTime = new Date(workHour.start_time);
      const clockIn = new Date(timeRecord.clock_in);

      // Set the year to 1970
      clockIn.setFullYear(1970);

      // Set the month to 01 (months are zero-based in JavaScript, so January is 0)
      clockIn.setMonth(0);

      // Set the day to 01
      clockIn.setDate(1);

      const diffTime = clockIn - startTime;
      if (diffTime > 0) {
        timeRecord.late_time = new Date(diffTime);
      } else {
        timeRecord.late_time = new Date(0);
      }
    }

    if (timeRecords == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(timeRecords);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update clock in and out info
router.put("/", async (req, res) => {
  // const id = parseInt(req.params.id);
  const { empId, date, clockIn, clockOut } = req.body;

  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const timeRecord = await prisma.time_record.findFirst({
      where: {
        emp_id: parseInt(empId),
        date: { gte: startDate, lt: endDate },
      },
    });

    if (timeRecord.clock_out != null) {
      res.status(400).json({ message: "User already clock out" });
      return;
    }

    const editTimeRecord = await prisma.time_record.update({
      where: {
        id: timeRecord.id,
      },
      data: {
        // emp_id: parseInt(empId) || undefined,
        // date: date ? new Date(date) : undefined,
        clock_in: clockIn ? new Date(clockIn) : undefined,
        clock_out: clockOut ? new Date(clockOut) : undefined,
        total_hours:
          (await calculateTotalHours(clockIn, clockOut, timeRecord.id)) ||
          undefined,
      },
    });

    res.status(200).json({
      status: 200,
      // message: `Record id ${id} successfully updated`,
      editTimeRecord,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete clock in and out info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleTimeRecord = await prisma.time_record.delete({
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
