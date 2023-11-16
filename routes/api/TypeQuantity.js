const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Create type quantity
router.post("/", async (req, res) => {
  const { typeId, year, quantity } = req.body;

  const getMaxLeaveType = await prisma.leave_type.aggregate({
    _max: {
      id: true,
    },
  });

  try {
    const createTypeQuantity = await prisma.type_quantity.create({
      data: {
        type_id: parseInt(typeId) || getMaxLeaveType._max.id,
        year: parseInt(year),
        quantity: parseInt(quantity),
      },
    });

    res.status(201).json({
      status: 201,
      message: "Record has been created",
      createTypeQuantity,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all type quantitys
router.get("/", async (req, res) => {
  const allTypeQuantity = await prisma.type_quantity.findMany({});

  res.status(200).json(allTypeQuantity);
});

// Read single type quantity
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleTypeQuantity = await prisma.type_quantity.findUnique({
      where: {
        id: id,
      },
    });

    if (singleTypeQuantity == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleTypeQuantity);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update type quantity info
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { typeId, year, quantity } = req.body;

  try {
    const editTypeQuantity = await prisma.type_quantity.update({
      where: {
        id: id,
      },
      data: {
        type_id: typeId ? parseInt(typeId) : undefined,
        year: year ? parseInt(year) : undefined,
        quantity: quantity ? parseInt(quantity) : undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editTypeQuantity,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete type quantity info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleTypeQuantity = await prisma.type_quantity.deleteMany({
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

// Delete many type quantity info
router.delete("/type/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleTypeQuantity = await prisma.type_quantity.deleteMany({
      where: {
        type_id: id,
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
