const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const token = jwt.sign(
    {
      date: new Date(),
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "60s",
    }
  );

  const createdToken = { token: token };

  res
    .status(201)
    .json({ status: 200, message: "Record has been created", createdToken });
});

router.post("/", async (req, res) => {
  const { token } = req.body;

  jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
    if (err) {
      return res.status(400).json({ error: err });
    }

    res.status(200).json({ status: 200, date: decoded.date });
  });
});

module.exports = router;
