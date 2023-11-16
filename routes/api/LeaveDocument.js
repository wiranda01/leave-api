const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");
const { sendEmail, emailContent } = require("../../email");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

var currentDate = new Date();

const calculateDayAmount = async (_startDate, _endDate, id) => {
  if (_startDate && _endDate) {
    const startDate = new Date(_startDate);
    const endDate = new Date(_endDate);

    return (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24 + 1;
  } else {
    const dates = await prisma.approval_doc.findUnique({
      where: {
        id: id,
      },
      select: {
        start_date: true,
        end_date: true,
      },
    });

    if (_startDate) {
      const startDate = new Date(_startDate);
      const endDate = new Date(dates.end_date);

      return (
        (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24 + 1
      );
    } else {
      const startDate = new Date(dates.start_date);
      const endDate = new Date(_endDate);

      return (
        (endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60 / 24 + 1
      );
    }
  }
};

async function updateStatus(id) {
  try {
    const getApprovalDoc = await prisma.approval_doc.findUnique({
      where: { id: id },
    });

    var status = "pending";
    const status_first_appr = getApprovalDoc.status_first_appr;
    const status_second_appr = getApprovalDoc.status_second_appr;

    if (!status_first_appr && !status_second_appr) {
      status = "approved";
    } else if (status_second_appr == null) {
      status = status_first_appr;
    } else {
      if (status_first_appr == "approved" && status_second_appr == "approved") {
        status = "approved";
      } else if (
        status_first_appr == "rejected" ||
        status_second_appr == "rejected"
      ) {
        status = "rejected";
      }
    }

    const editApprovalDoc = await prisma.approval_doc.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
}

// Create approval doc
router.post("/", upload.single("attachment"), async (req, res) => {
  const {
    empId,
    depId,
    typeId,
    startDate,
    endDate,
    reason,
    writtenPlace,
    backupContact,
  } = req.body;

  var attachment = null; // Initialize attachment as null

  if (req.file) {
    // Check if a file was uploaded
    attachment = path.join(req.file.destination, req.file.filename);
  }

  var status = "pending";
  var status_first_appr = "pending";
  var status_second_appr = "pending";
  var first_appr_at = null;
  var second_appr_at = null;

  try {
    const deparment_approver = await prisma.dep_appr.findUnique({
      where: {
        dep_id: parseInt(depId),
      },
      select: {
        id: true,
        dep_id: true,
        first_appr: true,
        second_appr: true,
        emp1_appr: {
          select: { first_name: true, last_name: true, email: true },
        },
        emp2_appr: {
          select: { first_name: true, last_name: true, email: true },
        },
      },
    });

    if (!deparment_approver.first_appr && !deparment_approver.second_appr) {
      status = "approved";
    }

    const senderName = await prisma.employee.findUnique({
      where: { id: parseInt(empId) || undefined },
      select: {
        first_name: true,
        last_name: true,
      },
    });
    if (deparment_approver.first_appr != null) {
      if (deparment_approver.first_appr == empId) {
        status_first_appr = "approved";
        first_appr_at = currentDate;
        if (!deparment_approver.second_appr) {
          status = "approved";
        }
      }
    }

    if (deparment_approver.second_appr != null) {
      if (deparment_approver.second_appr == empId) {
        status_second_appr = "approved";
        second_appr_at = currentDate;
        if (!deparment_approver.first_appr) {
          status = "approved";
        }
      }
    }

    const createApprovalDoc = await prisma.approval_doc.create({
      data: {
        emp_id: parseInt(empId),
        dep_id: parseInt(depId),
        type_id: parseInt(typeId),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        amount: await calculateDayAmount(startDate, endDate),
        reason: reason,
        written_place: writtenPlace,
        backup_contact: backupContact,
        attachment: attachment,
        status: status,
        status_first_appr: deparment_approver.first_appr
          ? status_first_appr
          : null,
        first_appr_at: deparment_approver.first_appr ? first_appr_at : null,
        status_second_appr: deparment_approver.second_appr
          ? status_second_appr
          : null,
        second_appr_at: deparment_approver.second_appr ? second_appr_at : null,
        notification: {
          create: {
            noti_type: "request",
            sender_id: parseInt(empId),
            first_receiver: deparment_approver.first_appr
              ? deparment_approver.first_appr
              : null,
            second_receiver: deparment_approver.second_appr
              ? deparment_approver.second_appr
              : null,
            is_seen_first: 0,
            is_seen_second: 0,
            created_at: new Date(),
          },
        },
      },
    });

    // Get dep appr
    // const depAppr = await prisma.dep_appr.findUnique({
    //   where: { dep_id: parseInt(depId) },
    // });

    // // Get latest doc for notification
    // const lastDocument = await prisma.approval_doc.findFirst({
    //   take: -1,
    //   select: { id: true },
    // });

    // const createNotification = await prisma.notification.create({
    //   data: {
    //     noti_type: "request",
    //     sender_id: parseInt(empId),
    //     doc_id: lastDocument.id,
    //     first_receiver: depAppr ? depAppr.first_appr : null,
    //     second_receiver: depAppr ? depAppr.second_appr : null,
    //     is_seen_first: 0,
    //     is_seen_second: 0,
    //     created_at: currentDate,
    //   },
    // });

    const approverEmails = [];

    if (deparment_approver.emp1_appr) {
      approverEmails.push({
        appr_email: deparment_approver.emp1_appr.email,
        appr_name: `${deparment_approver.emp1_appr.first_name} ${deparment_approver.emp1_appr.last_name}`,
      });
    }
    if (deparment_approver.emp2_appr) {
      approverEmails.push({
        appr_email: deparment_approver.emp2_appr.email,
        appr_name: `${deparment_approver.emp2_appr.first_name} ${deparment_approver.emp2_appr.last_name}`,
      });
    }

    approverEmails.forEach((approverEmail) => {
      sendEmail(
        approverEmail.appr_email,
        "Leave Request Pending",
        emailContent(
          "request",
          approverEmail.appr_name,
          `${senderName.first_name} ${senderName.last_name}`,
          createApprovalDoc.start_date,
          createApprovalDoc.end_date,
          createApprovalDoc.reason,
          createApprovalDoc.backup_contact
        )
      );
    });

    res.status(201).json({
      status: 201,
      message: "Record has been created",
      createApprovalDoc,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all approval docs for admin
router.get("/admin/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const depId = parseInt(req.query.depId);

  try {
    const leaveForAdmin = await prisma.approval_doc.findMany({
      where: {
        dep_id: depId || undefined,
      },
      select: {
        id: true,
        type: { select: { type_name: true } },
        amount: true,
        reason: true,
        status: true,
        start_date: true,
        end_date: true,
        emp: { select: { first_name: true, last_name: true } },
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json(leaveForAdmin);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all approval docs for department
router.get("/department/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const depId = parseInt(req.query.depId);

  try {
    const leaveForAdmin = await prisma.approval_doc.findMany({
      where: {
        dep_id: depId,
      },
      select: {
        id: true,
        type: { select: { type_name: true } },
        amount: true,
        reason: true,
        status: true,
        start_date: true,
        end_date: true,
        emp: { select: { first_name: true, last_name: true } },
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json(leaveForAdmin);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});
// Read all approval docs for user
router.get("/employee/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const allApprovalDocs = await prisma.approval_doc.findMany({
      where: {
        emp_id: id,
      },
      select: {
        id: true,
        type: {
          select: { type_name: true },
        },
        amount: true,
        reason: true,
        status: true,
        start_date: true,
        end_date: true,
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json(allApprovalDocs);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read single approval doc
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleApprovalDoc = await prisma.approval_doc.findUnique({
      where: {
        id: id,
      },
      select: {
        emp_id: true,
        type_id: true,
        dep_id: true,
        start_date: true,
        end_date: true,
        reason: true,
        written_place: true,
        backup_contact: true,
        attachment: true,
        status_first_appr: true,
        first_appr_at: true,
        status_second_appr: true,
        second_appr_at: true,
        status: true,
        emp: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        dep: {
          select: {
            dep_appr: {
              select: {
                emp1_appr: {
                  select: { id: true, first_name: true, last_name: true },
                },
                emp2_appr: {
                  select: { id: true, first_name: true, last_name: true },
                },
              },
            },
          },
        },
        type: { select: { type_name: true } },
      },
    });

    if (singleApprovalDoc == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleApprovalDoc);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update approval doc info
router.put("/:id", upload.single("attachment"), async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    empId,
    depId,
    typeId,
    startDate,
    endDate,
    reason,
    writtenPlace,
    backupContact,
    status,
  } = req.body;

  var attachment = null; // Initialize attachment as null

  if (req.file) {
    // Check if a file was uploaded
    attachment = path.join(req.file.destination, req.file.filename);
  }

  try {
    const editApprovalDoc = await prisma.approval_doc.update({
      where: {
        id: id,
      },
      data: {
        emp_id: empId ? parseInt(empId) : undefined,
        dep_id: depId ? parseInt(depId) : undefined,
        type_id: typeId ? parseInt(typeId) : undefined,
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
        amount:
          startDate || endDate
            ? await calculateDayAmount(startDate, endDate, id)
            : undefined,
        reason: reason || undefined,
        written_place: writtenPlace || undefined,
        backup_contact: backupContact || undefined,
        attachment: attachment || undefined,
        status: status || undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editApprovalDoc,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update approval doc status
router.put("/status/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const emp_id = parseInt(req.query.emp_id);
  const dep_id = parseInt(req.query.dep_id);

  const { status } = req.body;

  try {
    const deparment_approver = await prisma.dep_appr.findFirst({
      where: {
        dep_id: dep_id,
      },
    });

    // Get dep appr
    const depAppr = await prisma.dep_appr.findFirst({
      where: { dep_id: dep_id },
      select: {
        id: true,
        first_appr: true,
        second_appr: true,
        emp1_appr: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        emp2_appr: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    var isFirstAppr = false;
    if (deparment_approver.first_appr == emp_id) {
      isFirstAppr = true;
    }

    // Get doc sender
    const documentSender = await prisma.approval_doc.findUnique({
      where: { id: id },
      select: {
        emp: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    const editApprovalDoc = await prisma.approval_doc.update({
      where: {
        id: id,
      },
      data: {
        status_first_appr: isFirstAppr ? status : undefined,
        first_appr_at: isFirstAppr ? new Date() : undefined,
        status_second_appr: !isFirstAppr ? status : undefined,
        second_appr_at: !isFirstAppr ? new Date() : undefined,
        notification: {
          create: {
            noti_type: status,
            sender: { connect: { id: emp_id } },
            firstReceiver: {
              connect: { id: documentSender.emp.id },
            },
            ...(deparment_approver.second_appr
              ? {
                  secondReceiver: {
                    connect: {
                      id: isFirstAppr
                        ? deparment_approver.second_appr
                        : deparment_approver.first_appr,
                    },
                  },
                }
              : {}),
            is_seen_first: 0,
            is_seen_second: 0,
            created_at: new Date(),
          },
        },
      },
    });

    updateStatus(id);

    ////////////////////// Create Email //////////////////////

    // Get Notification sender
    const getNotificationSender = await prisma.employee.findUnique({
      where: { id: emp_id },
      select: { id: true, first_name: true, last_name: true, email: true },
    });

    // Get targeted doc info for email
    const getTargetedDoc = await prisma.approval_doc.findUnique({
      where: { id: id },
    });

    const approverEmails = [
      {
        appr_email: documentSender.emp.email,
        appr_name: `${documentSender.emp.first_name} ${documentSender.emp.last_name}`,
      },
      ...(depAppr.emp2_appr && isFirstAppr
        ? [
            {
              appr_email: depAppr.emp2_appr.email,
              appr_name: `${depAppr.emp2_appr.first_name} ${depAppr.emp2_appr.last_name}`,
            },
          ]
        : [
            {
              appr_email: depAppr.emp1_appr.email,
              appr_name: `${depAppr.emp1_appr.first_name} ${depAppr.emp1_appr.last_name}`,
            },
          ]),
    ];

    approverEmails.forEach((approverEmail) => {
      sendEmail(
        approverEmail.appr_email,
        `Leave Request approved`,
        emailContent(
          status,
          approverEmail.appr_name,
          `${getNotificationSender.first_name} ${getNotificationSender.last_name}`,
          "",
          "",
          "",
          "",
          id,
          getTargetedDoc.status_first_appr,
          getTargetedDoc.status_second_appr
            ? getTargetedDoc.status_second_appr
            : ""
        )
      );
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editApprovalDoc,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete approval doc info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleApprovalDoc = await prisma.approval_doc.delete({
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
