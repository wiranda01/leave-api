const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = require("../../client");

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const employee = await prisma.employee.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        password: true,
        email: true,
        dep_id: true,
        role: true,
        dep_appr1: { select: { id: true } },
        dep_appr2: { select: { id: true } },
      },
    });
    // if (username === "admin" || password === "rG8#jP$!2wL9") {
    //   const json = {
    //     role: "admin",
    //   };

    //   res.status(200).json(json);
    //   return;
    // }
    bcrypt.compare(password, employee.password, function (err, result) {
      if (result == true) {
        const json = {
          emp_id: employee.id,
          username: employee.username,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          dep_id: employee.dep_id,
          role: employee.role,
          is_first_approver: employee.dep_appr1.length > 0 ? 1 : 0,
          is_second_approver: employee.dep_appr2.length > 0 ? 1 : 0,
        };

        res.status(200).json(json);
        return;
      }

      res.status(400).json({ message: "Invalid username or password" });
    });
  } catch (e) {
    checkingValidationError(e, req, res);
  }
});

module.exports = router;
