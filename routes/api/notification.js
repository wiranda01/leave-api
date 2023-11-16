const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// var deparment_approver = await prisma.dep_appr.findFirst({
//   where: {
//     dep_id: dep_id,
//     OR: [{ first_appr: emp_id }, { second_appr: emp_id }],
//   },
// });

// if (!deparment_approver) {
//   res.status(400).json({ message: "deparment approver not found" });
//   return;
// }

// var isFirstAppr = false;
// if (deparment_approver.first_appr == emp_id) {
//   isFirstAppr = true;
// }

router.get("/", async (req, res) => {
  const currentDate = new Date();
  const emp_id = parseInt(req.query.emp_id);
  // const dep_id = parseInt(req.query.dep_id);

  try {
    const docNotification = await prisma.notification.findMany({
      orderBy: { created_at: "desc" },
      take: 15,
      where: { OR: [{ first_receiver: emp_id }, { second_receiver: emp_id }] },
      select: {
        id: true,
        noti_type: true,
        sender_id: true,
        first_receiver: true,
        second_receiver: true,
        doc_id: true,
        created_at: true,
        is_seen_first: true,
        is_seen_second: true,
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        firstReceiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        secondReceiver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    res.status(200).json({
      docNotification,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

router.post("/", async (req, res) => {
  const { type, sender, docId, firstReceiver, secondReceiver } = req.body;

  try {
    const createNotification = await prisma.notification.create({
      data: {
        noti_type: type,
        sender_id: parseInt(sender),
        doc_id: parseInt(docId),
        first_receiver: firstReceiver ? parseInt(firstReceiver) : undefined,
        second_receiver: secondReceiver ? parseInt(secondReceiver) : undefined,
        doc_id: getMaxDoc._max.id,
        is_seen_first: 0,
        is_seen_second: 0,
      },
    });

    res.status(201).json({
      status: 201,
      message: "Record has been created",
      createNotification,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

//update
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const empId = req.query.user;

  try {
    const getNotification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
      select: { first_receiver: true, second_receiver: true },
    });

    const setRead = await prisma.notification.update({
      where: {
        id: parseInt(id),
      },
      data: {
        is_seen_first:
          getNotification.first_receiver === parseInt(empId) ? 1 : undefined,
        is_seen_second:
          getNotification.second_receiver === parseInt(empId) ? 1 : undefined,
      },
    });

    res.status(201).json({
      status: 201,
      message: "Record has been updated",
      setRead,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
