import { PrismaLibSql } from '@prisma/adapter-libsql'
const adapter = new PrismaLibSql({ url: "file:./dev.db" })
console.log("Success")
