-- CreateTable
CREATE TABLE "SetSave" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SetSave_user_id_set_id_key" ON "SetSave"("user_id", "set_id");

-- AddForeignKey
ALTER TABLE "SetSave" ADD CONSTRAINT "SetSave_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetSave" ADD CONSTRAINT "SetSave_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "Set"("set_id") ON DELETE RESTRICT ON UPDATE CASCADE;
