import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from "@prisma/client"

const url = process.env.DATABASE_URL || "file:../../backend/prisma/dev.db";
const adapter = new PrismaLibSql({ url });

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
