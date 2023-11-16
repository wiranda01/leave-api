const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Create leave type
router.post("/", async (req, res) => {
  const { typeName, fixedQuota, type, typeQuantity } = req.body;

  try {
    const createLeaveType = await prisma.leave_type.create({
      data: {
        type_name: typeName,
        fixed_quota: parseInt(fixedQuota),
        type: type,
        type_quantity: {
          createMany: {
            data: typeQuantity.map((item) => ({
              year: parseInt(item.year),
              quantity: parseInt(item.quantity),
            })),
          },
        },
      },
    });

    res.status(201).json({
      status: 200,
      message: "Record has been created",
      createLeaveType,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all leave type
router.get("/", async (req, res) => {
  const allLeaveType = await prisma.leave_type.findMany({
    include: { type_quantity: true },
  });

  res.status(200).json(allLeaveType);
});

// Read single leave type
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleLeaveType = await prisma.leave_type.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        type_name: true,
        fixed_quota: true,
        type: true,
        type_quantity: { orderBy: { year: "asc" } },
      },
    });

    if (singleLeaveType == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleLeaveType);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update leave type info
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { typeName, fixedQuota, type, typeQuantity } = req.body;

  try {
    const editLeaveType = await prisma.leave_type.update({
      where: {
        id: id,
      },
      data: {
        type_name: typeName || undefined,
        fixed_quota: fixedQuota ? parseInt(fixedQuota) : undefined,
        type: type || undefined,
        type_quantity: { deleteMany: { type_id: id } },
      },
    });

    await prisma.type_quantity.createMany({
      data: typeQuantity.map((item) => ({
        type_id: id,
        year: parseInt(item.year),
        quantity: parseInt(item.quantity),
      })),
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editLeaveType,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete leave type info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleLeaveType = await prisma.leave_type.delete({
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
