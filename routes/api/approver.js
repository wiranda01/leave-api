const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

// Create approver
router.post("/", async (req, res) => {
  const { depId, firstApprover, secondApprover } = req.body;

  const getMaxDepartment = await prisma.department.aggregate({
    _max: {
      id: true,
    },
  });

  try {
    const createApprover = await prisma.dep_appr.create({
      data: {
        dep_id: depId ? parseInt(depId) : getMaxDepartment._max.id,
        first_appr: parseInt(firstApprover),
        second_appr: parseInt(secondApprover),
      },
    });

    res.status(201).json({
      status: 201,
      message: "Record has been created",
      createApprover,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all approvers
router.get("/", async (req, res) => {
  const allApprover = await prisma.dep_appr.findMany();

  res.status(200).json(allApprover);
});

// Read single approver
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleApprover = await prisma.dep_appr.findUnique({
      where: {
        id: id,
      },
    });

    if (singleApprover == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${id}` });
    res.status(200).json(singleApprover);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});
// Read single approver with DepId
router.get("/DepId/:id", async (req, res) => {
  const depId = parseInt(req.params.id);
  try {
    const singleApprover = await prisma.dep_appr.findUnique({
      where: {
        dep_id: depId,
      },
    });

    if (singleApprover == null)
      return res
        .status(404)
        .json({ status: 404, msg: `no record with id of ${depId}` });
    res.status(200).json(singleApprover);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update approver info
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { depId, firstApprover, secondApprover } = req.body;

  try {
    const editApprover = await prisma.dep_appr.update({
      where: {
        id: id,
      },
      data: {
        dep_id: depId ? parseInt(depId) : undefined,
        first_appr: firstApprover ? parseInt(firstApprover) : undefined,
        second_appr: secondApprover ? parseInt(secondApprover) : undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editApprover,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update approver info with depId
router.put("/DepId/:id", async (req, res) => {
  const depId = parseInt(req.params.id);
  const { firstApprover, secondApprover } = req.body;

  try {
    const editApprover = await prisma.dep_appr.update({
      where: {
        dep_id: depId,
      },
      data: {
        first_appr: firstApprover ? parseInt(firstApprover) : undefined,
        second_appr: secondApprover ? parseInt(secondApprover) : undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${depId} successfully updated`,
      editApprover,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete approver info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleApprover = await prisma.dep_appr.delete({
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
