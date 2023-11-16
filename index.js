const express = require("express");
const cors = require("cors");
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

const app = express();

// Body Parser Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Home Page Route
app.get("/", (req, res) => res.status(200).send("Leave Management API"));

// Api Routes
app.use(express.static("public"));
app.use("/api/AdminDashboard", require("./routes/api/AdminDashboard"));
app.use("/api/ClockInOut", require("./routes/api/ClockInOut"));
app.use("/api/holiday", require("./routes/api/holiday"));
app.use("/api/department", require("./routes/api/department"));
app.use(
  "/api/DepartmentDashboard",
  require("./routes/api/DepartmentDashboard")
);
app.use("/api/employee", require("./routes/api/employee"));
app.use("/api/LeaveDocument", require("./routes/api/LeaveDocument"));
app.use("/api/LeaveDashboard", require("./routes/api/LeaveDashboard"));
app.use("/api/LeaveType", require("./routes/api/LeaveType"));
app.use("/api/approver", require("./routes/api/approver"));
app.use("/api/TypeQuantity", require("./routes/api/TypeQuantity"));
app.use("/api/login", require("./routes/api/login"));
app.use("/api/token", require("./routes/api/token"));
app.use("/api/notification", require("./routes/api/notification"));
app.use("/api/workHour", require("./routes/api/workHour"));
app.use("/api/excel", require("./routes/api/ExportExcel"));

// Global function for error handling
global.checkingValidationError = (e, req, res) => {
  if (e instanceof Prisma.PrismaClientValidationError) {
    console.log(e);
    res.status(422).json({
      status: 422,
      message: "Incorrect field type provided or missing an input",
    });
  } else if (e.meta) {
    console.log(e);
    res.status(404).json({
      status: 404,
      message:
        e.meta.cause ||
        `conflicted with key of ${e.meta.field_name} or unique key already exist`,
    });
  } else {
    console.log(e);
    res.status(400).json({ status: 400, message: "Error Occured" });
  }
};

global.getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formattedToday = today.toLocaleString("sv").replace(" ", "T") + ".000Z";

  return formattedToday;
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
