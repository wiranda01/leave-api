const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Get amount of all employee, all [pending, approved, rejected] doc with the same department as user
router.get("/:depId", async (req, res) => {
  const requestedDepartment = req.params.depId;
  const currentDate = new Date();

  try {
    const empAmountDepartment = await prisma.employee.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          dep_id: parseInt(requestedDepartment),
          status: "active",
        },
      },
    });

    const pendingAmountDepartment = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          dep_id: parseInt(requestedDepartment),
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "pending",
          },
        },
      },
    });

    const approvedAmountDepartment = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          dep_id: parseInt(requestedDepartment),
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "approved",
          },
        },
      },
    });

    const rejectedAmountDepartment = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          dep_id: parseInt(requestedDepartment),
          end_date: {
            gt: currentDate, // if the end date and time is greater than current date and time
          },
          status: {
            contains: "rejected",
          },
        },
      },
    });

    const todayAmountDepartment = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          dep_id: parseInt(requestedDepartment),
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
      empAmountDepartment,
      pendingAmountDepartment,
      approvedAmountDepartment,
      rejectedAmountDepartment,
      todayAmountDepartment,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
