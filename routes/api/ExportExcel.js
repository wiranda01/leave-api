const express = require("express");
const router = express.Router();
const excelJS = require("exceljs");
const { PrismaClient } = require("@prisma/client");

const prisma = require("../../client");

var monthsArray = [
  {
    idx: 0,
    thai: "มกราคม",
    english: "January",
  },
  {
    idx: 1,
    thai: "กุมภาพันธ์",
    english: "Febuary",
  },
  {
    idx: 2,
    thai: "มีนาคม",
    english: "March",
  },
  {
    idx: 3,
    thai: "เมษายน",
    english: "April",
  },
  {
    idx: 4,
    thai: "พฤษภาคม",
    english: "May",
  },
  {
    idx: 5,
    thai: "มิถุนายน",
    english: "June",
  },
  {
    idx: 6,
    thai: "กรกฎาคม",
    english: "July",
  },
  {
    idx: 7,
    thai: "สิงหาคม",
    english: "August",
  },
  {
    idx: 8,
    thai: "กันยายน",
    english: "September",
  },
  {
    idx: 9,
    thai: "ตุลาคม",
    english: "October",
  },
  {
    idx: 10,
    thai: "พฤศจิกายน",
    english: "November",
  },
  {
    idx: 11,
    thai: "ธันวาคม",
    english: "December",
  },
];

function getDaysInRange(startDate, endDate) {
  const daysArray = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    daysArray.push(new Date(currentDate).toLocaleDateString("en-GB"));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return daysArray;
}

router.get("/all/day", async (req, res) => {
  const date = new Date(req.query.date);
  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);

  try {
    const datedTimeRecords = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        time_record: {
          where: {
            date: { gte: startDate, lt: endDate },
          },
          include: {},
        },
      },
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(date.toDateString());

    // Define columns in the worksheet

    worksheet.columns = [
      { header: "ชื่อ", key: "name", width: 20 },
      {
        header: "เวลาเข้างาน",
        key: "clockIn",
        width: 15,
      },
      {
        header: "เวลาเลิกงาน",
        key: "clockOut",
        width: 15,
      },
      {
        header: "ชั่วโมงที่ทำงาน",
        key: "workHours",
        width: 15,
      },
    ];
    const formattedRecords = datedTimeRecords.map((item) => ({
      name: `${item.first_name} ${item.last_name}`,
      clockIn:
        item.time_record.length > 0 ? item.time_record.at(0).clock_in : "-",
      clockOut:
        item.time_record.length > 0 ? item.time_record.at(0).clock_out : "-",
      workHours:
        item.time_record.length > 0 ? item.time_record.at(0).total_hours : "-",
    }));

    // Add data to the worksheet
    formattedRecords.forEach((item) => {
      worksheet.addRow(item);
    });

    // Set up the response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=time_record_${date.toLocaleDateString(
        "th-GB"
      )}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    checkingValidationError(e, req, res);
    console.log(e);
  }
});

router.get("/all/month", async (req, res) => {
  const month = parseInt(req.query.month);

  const monthName = monthsArray.filter((item) => item.idx === month);

  const startDateOfMonth = new Date();
  startDateOfMonth.setMonth(month);
  startDateOfMonth.setDate(1);

  const endDateOfMonth = new Date();
  endDateOfMonth.setMonth(month + 1);
  endDateOfMonth.setDate(0);

  const dateBetween = getDaysInRange(
    new Date(startDateOfMonth),
    new Date(endDateOfMonth)
  );

  try {
    startDateOfMonth.setHours(0, 0, 0, 0);
    endDateOfMonth.setHours(0, 0, 0, 0);
    const monthTimeRecords = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        time_record: {
          where: {
            date: {
              gte: startDateOfMonth,
              lt: endDateOfMonth,
            },
          },
          include: {},
        },
      },
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(monthName.at(0).thai);

    const columnsArray = [];

    columnsArray.push({ header: "ชื่อ", key: "name", width: 20 });

    dateBetween.forEach((day, index) => {
      columnsArray.push({ header: day, key: day, width: 13 });
    });

    worksheet.columns = columnsArray;

    const getNameFromRecords = monthTimeRecords.map((item) => ({
      id: item.id,
      name: `${item.first_name} ${item.last_name}`,
      time_record: item.time_record,
    }));

    getNameFromRecords.forEach((record, idx) => {
      dateBetween.forEach((date, index) => {
        return (getNameFromRecords.at(idx)[date] = record.time_record.some(
          (time) => time.date.toLocaleDateString("en-GB") === date
        )
          ? `${record.time_record
              .filter((time) => time.date.toLocaleDateString("en-GB") === date)
              .at(0)
              .clock_in?.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${record.time_record
              .filter((time) => time.date.toLocaleDateString("en-GB") === date)
              .at(0)
              .clock_out?.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
          : "-");
      });
    });

    getNameFromRecords.forEach((item) => {
      worksheet.addRow(item);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename= Time_Record_${monthName.at(0).english}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    console.log(e);
    checkingValidationError(e, req, res);
  }
});

router.get("/all/year", async (req, res) => {
  const year = parseInt(req.query.year);

  try {
    const workbook = new excelJS.Workbook();

    for (const month of monthsArray) {
      const startDateOfMonth = new Date();
      startDateOfMonth.setFullYear(year, month.idx, 1);
      startDateOfMonth.setHours(0, 0, 0, 0);

      const endDateOfMonth = new Date();
      endDateOfMonth.setFullYear(year, month.idx + 1, 0);
      endDateOfMonth.setHours(0, 0, 0, 0);

      const dateBetween = getDaysInRange(
        new Date(startDateOfMonth),
        new Date(endDateOfMonth)
      );

      const monthTimeRecords = await prisma.employee.findMany({
        select: {
          id: true,
          first_name: true,
          last_name: true,
          dep: {
            select: {
              id: true,
              dep_name: true,
            },
          },
          time_record: {
            where: {
              date: {
                gte: startDateOfMonth,
                lt: endDateOfMonth,
              },
            },
            include: {},
          },
        },
      });

      const columnsArray = [];

      columnsArray.push({ header: "ชื่อ", key: "name", width: 20 });

      dateBetween.forEach((day) => {
        columnsArray.push({ header: day, key: day, width: 13 });
      });

      const worksheet = workbook.addWorksheet(month.thai);
      worksheet.columns = columnsArray;

      const getNameFromRecords = monthTimeRecords.map((item) => ({
        id: item.id,
        name: `${item.first_name} ${item.last_name}`,
        time_record: item.time_record,
      }));

      getNameFromRecords.forEach((record, idx) => {
        dateBetween.forEach((date, index) => {
          return (getNameFromRecords.at(idx)[date] = record.time_record.some(
            (time) => time.date.toLocaleDateString("en-GB") === date
          )
            ? `${record.time_record
                .filter(
                  (time) => time.date.toLocaleDateString("en-GB") === date
                )
                .at(0)
                .clock_in?.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} - ${
                record.time_record
                  .filter(
                    (time) => time.date.toLocaleDateString("en-GB") === date
                  )
                  .at(0).clock_out
                  ? record.time_record
                      .filter(
                        (time) => time.date.toLocaleDateString("en-GB") === date
                      )
                      .at(0)
                      .clock_out.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                  : "?"
              }`
            : "-");
        });
      });

      getNameFromRecords.forEach((item) => {
        worksheet.addRow(item);
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename= Time_Record_${year}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    checkingValidationError(e, req, res);
    console.log(e);
  }
});

router.get("/leave/all/day", async (req, res) => {
  const date = new Date(req.query.date);
  const startDate = new Date(date);
  const endDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(24, 0, 0, 0);
  try {
    const datedTimeRecords = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        approval_docs: {
          where: {
            start_date: { gte: startDate },
            end_date: { lt: endDate },
          },
          include: { type: true },
        },
      },
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(date.toDateString());

    console.log(datedTimeRecords);

    // Define columns in the worksheet

    worksheet.columns = [
      { header: "ชื่อ", key: "name", width: 20 },
      {
        header: "ประเภท",
        key: "type",
        width: 15,
      },
      {
        header: "วันที่ลา",
        key: "date",
        width: 15,
      },
      {
        header: "จำนวนวัน",
        key: "amount",
        width: 15,
      },
      {
        header: "เหตุผลการลา",
        key: "reason",
        width: 15,
      },
      {
        header: "สถานะ",
        key: "status",
        width: 15,
      },
    ];
    const formattedRecords = datedTimeRecords.map((item) => ({
      name: `${item.first_name} ${item.last_name}`,
      type:
        item.approval_docs.length > 0
          ? item.approval_docs.at(0).type.type_name
          : "-",
      date:
        item.approval_docs.length > 0
          ? `${item.approval_docs.at(0).start_date} - ${
              item.approval_docs.at(0).end_date
            }`
          : "-",
      amount:
        item.approval_docs.length > 0 ? item.approval_docs.at(0).amount : "-",
      reason:
        item.approval_docs.length > 0 ? item.approval_docs.at(0).reason : "-",
      status:
        item.approval_docs.length > 0 ? item.approval_docs.at(0).reason : "-",
    }));

    // Add data to the worksheet
    formattedRecords.forEach((item) => {
      worksheet.addRow(item);
    });

    // Set up the response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Record_${date.toLocaleDateString(
        "th-GB"
      )}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    checkingValidationError(e, req, res);
    console.log(e);
  }
});

router.get("/leave/all/month", async (req, res) => {
  const month = parseInt(req.query.month);

  const monthName = monthsArray.filter((item) => item.idx === month);

  const startDateOfMonth = new Date();
  startDateOfMonth.setMonth(month);
  startDateOfMonth.setDate(1);

  const endDateOfMonth = new Date();
  endDateOfMonth.setMonth(month + 1);
  endDateOfMonth.setDate(0);

  const dateBetween = getDaysInRange(
    new Date(startDateOfMonth),
    new Date(endDateOfMonth)
  );

  try {
    startDateOfMonth.setHours(0, 0, 0, 0);
    endDateOfMonth.setHours(0, 0, 0, 0);
    const monthTimeRecords = await prisma.employee.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        dep: {
          select: {
            id: true,
            dep_name: true,
          },
        },
        time_record: {
          where: {
            date: {
              gte: startDateOfMonth,
              lt: endDateOfMonth,
            },
          },
          include: {},
        },
        approval_docs: {
          where: {
            start_date: { gte: startDateOfMonth },
            end_date: { lt: endDateOfMonth },
            status: "approved",
          },
          select: { start_date: true, end_date: true },
        },
      },
    });
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(monthName.at(0).thai);

    const columnsArray = [];

    columnsArray.push({ header: "ชื่อ", key: "name", width: 20 });

    dateBetween.forEach((day, index) => {
      columnsArray.push({ header: day, key: day, width: 13 });
    });

    columnsArray.push(
      { header: "เข้า", key: "in", width: 10 },
      { header: "ลา", key: "leave", width: 10 }
    );

    worksheet.columns = columnsArray;

    const getNameFromRecords = monthTimeRecords.map((item) => {
      const daysLeave = item.approval_docs.flatMap((item) =>
        getDaysInRange(item.start_date, item.end_date)
      );
      return {
        id: item.id,
        name: `${item.first_name} ${item.last_name}`,
        time_record: item.time_record,
        approval_docs: item.approval_docs,
        days_leave: daysLeave,
        in: item.time_record.length.toString(),
        leave: daysLeave.length.toString(),
      };
    });

    getNameFromRecords.forEach((record, idx) => {
      dateBetween.forEach((date, index) => {
        return (getNameFromRecords.at(idx)[date] = record.time_record.some(
          (time) => time.date.toLocaleDateString("en-GB") === date
        )
          ? `1`
          : (getNameFromRecords.at(idx)[date] = record.days_leave.some(
              (leave) => date === leave
            )
              ? "ลา"
              : "-"));
      });
    });

    getNameFromRecords.forEach((item) => {
      worksheet.addRow(item);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Record_${monthName.at(0).english}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    console.log(e);
    checkingValidationError(e, req, res);
  }
});

router.get("/leave/all/year", async (req, res) => {
  const year = parseInt(req.query.year);

  try {
    const workbook = new excelJS.Workbook();

    for (const month of monthsArray) {
      const startDateOfMonth = new Date();
      startDateOfMonth.setFullYear(year, month.idx, 1);
      startDateOfMonth.setHours(0, 0, 0, 0);

      const endDateOfMonth = new Date();
      endDateOfMonth.setFullYear(year, month.idx + 1, 0);
      endDateOfMonth.setHours(0, 0, 0, 0);

      const dateBetween = getDaysInRange(
        new Date(startDateOfMonth),
        new Date(endDateOfMonth)
      );

      const monthTimeRecords = await prisma.employee.findMany({
        select: {
          id: true,
          first_name: true,
          last_name: true,
          dep: {
            select: {
              id: true,
              dep_name: true,
            },
          },
          time_record: {
            where: {
              date: {
                gte: startDateOfMonth,
                lt: endDateOfMonth,
              },
            },
            include: {},
          },
          approval_docs: {
            where: {
              start_date: { gte: startDateOfMonth },
              end_date: { lt: endDateOfMonth },
              status: "approved",
            },
          },
        },
      });

      const columnsArray = [];

      columnsArray.push({ header: "ชื่อ", key: "name", width: 20 });

      dateBetween.forEach((day) => {
        columnsArray.push({ header: day, key: day, width: 13 });
      });

      columnsArray.push(
        { header: "เข้า", key: "in", width: 10 },
        { header: "ลา", key: "leave", width: 10 }
      );

      const worksheet = workbook.addWorksheet(month.thai);
      worksheet.columns = columnsArray;

      const getNameFromRecords = monthTimeRecords.map((item) => {
        const daysLeave = item.approval_docs.flatMap((item) =>
          getDaysInRange(item.start_date, item.end_date)
        );
        return {
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
          time_record: item.time_record,
          approval_docs: item.approval_docs,
          days_leave: daysLeave,
          in: item.time_record.length.toString(),
          leave: daysLeave.length.toString(),
        };
      });

      getNameFromRecords.forEach((record, idx) => {
        dateBetween.forEach((date, index) => {
          return (getNameFromRecords.at(idx)[date] = record.time_record.some(
            (time) => time.date.toLocaleDateString("en-GB") === date
          )
            ? `1`
            : (getNameFromRecords.at(idx)[date] = record.days_leave.some(
                (leave) => date === leave
              )
                ? "ลา"
                : "-"));
        });
      });

      getNameFromRecords.forEach((item) => {
        worksheet.addRow(item);
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename= Attendance_Record_${year}.xlsx`
    );
    // Write the workbook to the response object
    workbook.xlsx.write(res).then(() => res.end());
  } catch (e) {
    checkingValidationError(e, req, res);
    console.log(e);
  }
});

module.exports = router;
