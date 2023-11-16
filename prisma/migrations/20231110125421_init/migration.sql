-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(0) NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "auth" INTEGER NOT NULL,
    "dep_id" INTEGER,
    "date_employed" TIMESTAMP(0) NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "dep_name" TEXT NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dep_appr" (
    "id" SERIAL NOT NULL,
    "dep_id" INTEGER NOT NULL,
    "first_appr" INTEGER,
    "second_appr" INTEGER,

    CONSTRAINT "dep_appr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_type" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,
    "fixed_quota" INTEGER,
    "type" TEXT NOT NULL,

    CONSTRAINT "leave_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_quantity" (
    "id" SERIAL NOT NULL,
    "type_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "type_quantity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_doc" (
    "id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "dep_id" INTEGER,
    "type_id" INTEGER,
    "start_date" TIMESTAMP(0) NOT NULL,
    "end_date" TIMESTAMP(0) NOT NULL,
    "reason" TEXT NOT NULL,
    "written_place" TEXT NOT NULL,
    "backup_contact" TEXT NOT NULL,
    "attachment" TEXT,
    "status" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "first_appr_at" TIMESTAMP(0),
    "second_appr_at" TIMESTAMP(0),
    "status_first_appr" TEXT,
    "status_second_appr" TEXT,

    CONSTRAINT "approval_doc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_record" (
    "id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "date" TIMESTAMP(0) NOT NULL,
    "clock_in" TIMESTAMP(0) NOT NULL,
    "clock_out" TIMESTAMP(0),
    "total_hours" DECIMAL(4,2),

    CONSTRAINT "time_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(0) NOT NULL,
    "end_date" TIMESTAMP(0),

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "noti_type" TEXT NOT NULL,
    "sender_id" INTEGER,
    "first_receiver" INTEGER,
    "second_receiver" INTEGER,
    "doc_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "is_seen_first" INTEGER,
    "is_seen_second" INTEGER,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_hour" (
    "id" INTEGER NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,

    CONSTRAINT "work_hour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_username_key" ON "employee"("username");

-- CreateIndex
CREATE UNIQUE INDEX "dep_appr_dep_id_key" ON "dep_appr"("dep_id");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_start_date_key" ON "holiday"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_end_date_key" ON "holiday"("end_date");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_dep_id_fkey" FOREIGN KEY ("dep_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dep_appr" ADD CONSTRAINT "dep_appr_dep_id_fkey" FOREIGN KEY ("dep_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dep_appr" ADD CONSTRAINT "dep_appr_first_appr_fkey" FOREIGN KEY ("first_appr") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dep_appr" ADD CONSTRAINT "dep_appr_second_appr_fkey" FOREIGN KEY ("second_appr") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type_quantity" ADD CONSTRAINT "type_quantity_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "leave_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_doc" ADD CONSTRAINT "approval_doc_dep_id_fkey" FOREIGN KEY ("dep_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_doc" ADD CONSTRAINT "approval_doc_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_doc" ADD CONSTRAINT "approval_doc_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "leave_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_record" ADD CONSTRAINT "time_record_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "approval_doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_first_receiver_fkey" FOREIGN KEY ("first_receiver") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_second_receiver_fkey" FOREIGN KEY ("second_receiver") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
