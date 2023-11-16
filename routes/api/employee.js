const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = require("../../client");

// Create employee
router.post("/", async (req, res) => {
  const {
    firstName,
    lastName,
    depId,
    birthDate,
    email,
    phone,
    gender,
    address,
    username,
    password,
    auth,
    dateEmployed,
    status,
    role,
  } = req.body;

  const salt = bcrypt.genSaltSync(10);
  const hash = await bcrypt.hash(password, salt);

  try {
    if (role === "head") {
      const employee = await prisma.employee.findFirst({
        where: { dep_id: parseInt(depId), role: "head" },
      });

      if (employee != null) {
        return res
          .status(400)
          .json({ message: "Department already has head user" });
      }
    }

    const createEmployee = await prisma.employee.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        dep_id: parseInt(depId),
        birth_date: birthDate && new Date(birthDate),
        email: email,
        phone: phone,
        gender: gender,
        address: address,
        username: username,
        password: hash,
        date_employed: dateEmployed && new Date(dateEmployed),
        auth: auth ? parseInt(auth) : 0,
        status: status,
        role: role,
      },
    });

    res.status(201).json({
      status: 200,
      message: "Record has been created",
      createEmployee,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all employees
router.get("/", async (req, res) => {
  const allEmployee = await prisma.employee.findMany({
    include: {
      dep: true,
    },
  });

  res.status(200).json(allEmployee);
});

router.get("/dep/:dep_id", async (req, res) => {
  const dep_id = parseInt(req.params.dep_id);

  try {
    const allEmployee = await prisma.employee.findMany({
      where: {
        dep_id: dep_id,
      },
      include: {
        dep: true,
      },
    });

    res.status(200).json(allEmployee);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Get username
router.get("/usr", async (req, res) => {
  const { username } = req.query;

  const checkUsername = await prisma.employee.findUnique({
    select: { username: true },
    where: {
      username,
    },
  });

  res.status(200).json(checkUsername);
});

router.get("/head", async (req, res) => {
  const depId = parseInt(req.query.depId);
  try {
    const employee = await prisma.employee.findFirst({
      where: { dep_id: depId, role: "head" },
      select: {
        id: true,
      },
    });

    return res.status(200).json(employee);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Read all employees with only id and name
router.get("/getName", async (req, res) => {
  const allEmployee = await prisma.employee.findMany({
    select: {
      id: true,
      first_name: true,
      last_name: true,
    },
  });

  res.status(200).json(allEmployee);
});

router.get("/getAppr", async (req, res) => {
  const allAppr = await prisma.employee.findMany({
    select: {
      id: true,
      first_name: true,
      last_name: true,
    },
    where: {
      OR: [{ role: "admin" }, { role: "head" }],
    },
  });

  res.status(200).json(allAppr);
});

// Read single employee
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const singleEmployee = await prisma.employee.findUnique({
      where: {
        id: id,
      },
      include: {
        dep: true,
        dep_appr1: true,
        dep_appr2: true,
      },
    });

    res.status(200).json(singleEmployee);
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Update employee info
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    firstName,
    lastName,
    depId,
    birthDate,
    email,
    phone,
    gender,
    address,
    username,
    password,
    auth,
    dateEmployed,
    status,
    role,
  } = req.body;

  const salt = bcrypt.genSaltSync(10);
  const hash = await bcrypt.hash(password, salt);

  try {
    if (role === "head") {
      const employee = await prisma.employee.findFirst({
        where: { dep_id: parseInt(depId), role: "head" },
      });

      if (employee != null && employee.id != id) {
        return res
          .status(400)
          .json({ message: "Department already has head user" });
      }
    }

    const editEmployee = await prisma.employee.update({
      where: {
        id: id,
      },
      data: {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        dep_id: depId ? parseInt(depId) : undefined,
        birth_date: birthDate ? new Date(birthDate) : undefined,
        email: email || undefined,
        phone: phone || undefined,
        gender: gender || undefined,
        address: address || undefined,
        username: username || undefined,
        password: hash || undefined,
        date_employed: dateEmployed ? new Date(dateEmployed) : undefined,
        auth: auth ? parseInt(auth) : 0,
        status: status || undefined,
        role: role || undefined,
      },
    });

    res.status(200).json({
      status: 200,
      message: `Record id ${id} successfully updated`,
      editEmployee,
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

// Delete employee info
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const deleteSingleEmployee = await prisma.employee.delete({
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

// Edit employee info
module.exports = router;
