const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const moment = require("moment");

const prisma = require("../../client");

router.get("/:empId", async (req, res) => {
  const requestedEmployee = req.params.empId;
  const currentDate = new Date();

  try {
    // Get leave amount left
    const employedDate = await prisma.employee.findUnique({
      where: {
        id: parseInt(requestedEmployee),
      },
      select: {
        date_employed: true,
      },
    });

    var serviceYear =
      moment().diff(employedDate.date_employed, "years") === null
        ? moment().diff(employedDate.date_employed, "years")
        : 0;

    const allLeave = await prisma.approval_doc.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        emp_id: parseInt(requestedEmployee),
        OR: [{ status: "pending" }, { status: "approved" }],
        end_date: {
          gte: new Date(currentDate.getFullYear(), 0, 1),
          lt: new Date(currentDate.getFullYear() + 1, 0, 1),
        },
      },
    });

    const allLeaveType = await prisma.leave_type.findMany({
      include: {
        type_quantity: true,
      },
    });

    const allYearQnty = new Array();
    allLeaveType.forEach((item) => {
      item.type_quantity.forEach((item) => {
        allYearQnty.push(item.year);
      });
    });
    const maxYear = Math.max(...allYearQnty);

    const leaveQnty = new Array();
    const allLeaveQnty = new Array();

    allLeaveType.forEach(async (type) => {
      const leaveCount = await prisma.approval_doc.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          emp_id: parseInt(requestedEmployee),
          type_id: type.id,
          end_date: {
            gte: new Date(currentDate.getFullYear(), 0, 1),
            lt: new Date(currentDate.getFullYear() + 1, 0, 1),
          },
        },
      });

      if (type.type === "fixed") {
        allLeaveQnty.push({
          id: type.id,
          typeName: type.type_name,
          amountLeft: type.fixed_quota - leaveCount._sum.amount,
        });
      }
      if (type.type === "serviceYears") {
        type.type_quantity.forEach((syType) => {
          if (syType.year === serviceYear) {
            allLeaveQnty.push({
              id: type.id,
              typeName: type.type_name,
              amountLeft: syType.quantity - leaveCount._sum.amount,
            });
          } else if (serviceYear > maxYear) {
            if (syType.year === maxYear) {
              allLeaveQnty.push({
                id: type.id,
                typeName: type.type_name,
                amountLeft: syType.quantity - leaveCount._sum.amount,
              });
            }
          }
        });
      }
    });

    allLeaveType.forEach((type) => {
      if (type.type === "fixed") {
        leaveQnty.push(type.fixed_quota);
      }
      if (type.type === "serviceYears") {
        type.type_quantity.map((syType) => {
          if (syType.year === serviceYear) {
            leaveQnty.push(syType.quantity);
          } else if (serviceYear > maxYear) {
            if (syType.year === maxYear) {
              leaveQnty.push(syType.quantity);
            }
          }
        });
      }
    });

    const leaveQntyAmount = leaveQnty.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );

    const leaveAvailableAmount = leaveQntyAmount - allLeave._sum.amount;

    // Get count of pending day off
    const pendingLeave = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          emp_id: parseInt(requestedEmployee),
          end_date: {
            gte: new Date(currentDate.getFullYear(), 0, 1),
            lt: new Date(currentDate.getFullYear() + 1, 0, 1),
          },
          status: "pending",
        },
      },
    });

    const pendingLeaveAmount = pendingLeave._count.id;

    // Get count of approved day off
    const approvedLeave = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          emp_id: parseInt(requestedEmployee),
          end_date: {
            gte: new Date(currentDate.getFullYear(), 0, 1),
            lte: new Date(currentDate.getFullYear() + 1, 0, 1),
          },
          status: "approved",
        },
      },
    });

    const approvedLeaveAmount = approvedLeave._count.id;

    // Get count of rejected day off
    const rejectedLeave = await prisma.approval_doc.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: {
          emp_id: parseInt(requestedEmployee),
          end_date: {
            gte: new Date(currentDate.getFullYear(), 0, 1),
            lt: new Date(currentDate.getFullYear() + 1, 0, 1),
          },
          status: "rejected",
        },
      },
    });

    const rejectedLeaveAmount = rejectedLeave._count.id;

    res.status(200).json({
      leaveAvailableAmount,
      allLeaveQnty,
      pendingLeaveAmount,
      approvedLeaveAmount,
      rejectedLeaveAmount,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
