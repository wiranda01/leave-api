const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Get amount of all employee, all [pending, approved, rejected] doc
router.get("/", async (req, res) => {
  const currentDate = new Date();

  try {
    const empCount = await prisma.employee.aggregate({
      _count: {
        id: true,
      },
      where: {
        status: "active",
      },
    });

    const pendingAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "pending",
          },
        },
      },
    });

    const approvedAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "approved",
          },
        },
      },
    });

    const rejectedAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "rejected",
          },
        },
      },
    });

    const todayAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          start_date: {
            lte: currentDate,
          },
          end_date: {
            gte: currentDate, // if the end date and time is greater than current date and time ***** only count the day off that is not passed yet.
          },
          status: {
            contains: "approved",
          },
        },
      },
    });

    res.status(200).json({
      empCount,
      pendingAmount,
      approvedAmount,
      rejectedAmount,
      todayAmount,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.get("/department/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const currentDate = new Date();

  try {
    const empCount = await prisma.employee.aggregate({
      _count: {
        id: true,
      },
      where: {
        status: "active",
        dep_id: id,
      },
    });

    const pendingAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "pending",
          },
          dep_id: id,
        },
      },
    });

    const approvedAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "approved",
          },
          dep_id: id,
        },
      },
    });

    const rejectedAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "rejected",
          },
          dep_id: id,
        },
      },
    });

    const todayAmount = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          start_date: {
            lte: currentDate,
          },
          end_date: {
            gte: currentDate, // if the end date and time is greater than current date and time ***** only count the day off that is not passed yet.
          },
          status: {
            contains: "approved",
          },
          dep_id: id,
        },
      },
    });

    res.status(200).json({
      empCount,
      pendingAmount,
      approvedAmount,
      rejectedAmount,
      todayAmount,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.post("/day", async (req, res) => {
  const { date } = req.body;

  const startDate = new Date(date);
  const endDate = new Date(date);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const timeRecords = await prisma.time_record.findMany({
      where: {
        clock_in: { gte: startDate, lt: endDate },
      },
      select: {
        id: true,
        emp_id: true,
        clock_in: true,
        emp: { select: { first_name: true, last_name: true } },
      },
    });

    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    for (let timeRecord of timeRecords) {
      const startTime = new Date(workHour.start_time);
      const clockIn = new Date(timeRecord.clock_in);

      startTime.setDate(clockIn.getDate());
      startTime.setMonth(clockIn.getMonth());
      startTime.setFullYear(clockIn.getFullYear());
      startTime.setMinutes(
        startTime.getMinutes() + clockIn.getTimezoneOffset()
      );

      const diffTime = clockIn - startTime;
      if (diffTime > 0) {
        timeRecord.late_time = new Date(diffTime);
        timeRecord.status = "late";
      } else {
        timeRecord.late_time = new Date(0);
        timeRecord.status = "on time";
      }
    }

    const employeeLeaves = await prisma.approval_doc.findMany({
      where: {
        start_date: { lte: startDate },
        end_date: { gte: startDate },
        status: { contains: "approved" },
      },
      select: {
        id: true,
        emp: { select: { first_name: true, last_name: true } },
      },
    });

    res.status(200).json({ timeRecords, employeeLeaves });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.post("/day-range", async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const timeRecords = await prisma.time_record.findMany({
      where: {
        clock_in: { gte: startDate, lt: endDate },
      },
      select: {
        id: true,
        emp_id: true,
        clock_in: true,
        emp: { select: { first_name: true, last_name: true } },
      },
    });

    const workHour = await prisma.work_hour.findUnique({
      where: {
        id: 1,
      },
    });

    for (let timeRecord of timeRecords) {
      const startTime = new Date(workHour.start_time);
      const clockIn = new Date(timeRecord.clock_in);

      startTime.setDate(clockIn.getDate());
      startTime.setMonth(clockIn.getMonth());
      startTime.setFullYear(clockIn.getFullYear());
      startTime.setMinutes(
        startTime.getMinutes() + clockIn.getTimezoneOffset()
      );

      const diffTime = clockIn - startTime;
      if (diffTime > 0) {
        timeRecord.late_time = new Date(diffTime);
        timeRecord.status = "late";
      } else {
        timeRecord.late_time = new Date(0);
        timeRecord.status = "on time";
      }
    }

    const employeeLeaves = await prisma.approval_doc.findMany({
      where: {
        start_date: { gte: startDate },
        end_date: { lt: endDate },
        status: { contains: "approved" },
      },
      select: {
        id: true,
        emp_id: true,
        amount: true,
        emp: { select: { first_name: true, last_name: true } },
      },
    });

    const employeeRecords = {};

    for (let timeRecord of timeRecords) {
      if (!(timeRecord.emp_id in employeeRecords)) {
        employeeRecords[timeRecord.emp_id] = {
          name: timeRecord.emp.first_name + " " + timeRecord.emp.last_name,
          on_time_amount: 0,
          late_amount: 0,
          leave_amount: 0,
        };
      }

      if (timeRecord.status == "on time") {
        employeeRecords[timeRecord.emp_id].on_time_amount += 1;
      }

      if (timeRecord.status == "late") {
        employeeRecords[timeRecord.emp_id].late_amount += 1;
      }
    }

    for (let employeeLeave of employeeLeaves) {
      if (!(employeeLeave.emp_id in employeeRecords)) {
        employeeRecords[employeeLeave.emp_id] = {
          name:
            employeeLeave.emp.first_name + " " + employeeLeave.emp.last_name,
          on_time_amount: 0,
          late_amount: 0,
          leave_amount: 0,
        };
      }

      employeeRecords[employeeLeave.emp_id].leave_amount +=
        employeeLeave.amount;
    }

    res.status(200).json({ timeRecords, employeeLeaves, employeeRecords });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
