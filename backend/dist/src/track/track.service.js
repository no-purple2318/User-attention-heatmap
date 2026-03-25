"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TrackService = class TrackService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(userId, url) {
        const session = await this.prisma.session.create({
            data: {
                userId,
                url: url || 'unknown',
            },
        });
        return { sessionId: session.id };
    }
    async createEvents(userId, sessionId, events) {
        if (!sessionId || !events || !Array.isArray(events)) {
            throw new common_1.BadRequestException('Invalid Session ID or Events payload');
        }
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== userId) {
            throw new common_1.BadRequestException('Session mismatch');
        }
        const data = events.map((ev) => ({
            sessionId,
            timestamp: new Date(ev.t || Date.now()),
            type: ev.type,
            x: Number(ev.x) || 0,
            y: Number(ev.y) || 0,
        }));
        if (data.length > 0) {
            await this.prisma.eventLog.createMany({
                data,
            });
        }
        return { success: true, count: data.length };
    }
};
exports.TrackService = TrackService;
exports.TrackService = TrackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackService);
//# sourceMappingURL=track.service.js.map