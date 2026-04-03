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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
const zod_1 = require("zod");
const EventSchema = zod_1.z.object({
    type: zod_1.z.enum(['mouse', 'scroll', 'eye', 'MOUSE', 'SCROLL', 'EYE']),
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    timestamp: zod_1.z.string().or(zod_1.z.number()).or(zod_1.z.date())
});
const IngestSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    url: zod_1.z.string().min(1),
    events: zod_1.z.array(EventSchema)
});
let TrackController = class TrackController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackEvents(req, body) {
        let parsed;
        try {
            parsed = IngestSchema.parse(body);
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid Event Payload schema: ' + e);
        }
        const userId = req.user.id;
        const { sessionId, url, events } = parsed;
        let session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            session = await this.prisma.session.create({
                data: { id: sessionId, userId, url }
            });
        }
        if (events && events.length > 0) {
            await this.prisma.eventLog.createMany({
                data: events.map(ev => ({
                    sessionId,
                    timestamp: new Date(ev.timestamp),
                    type: ev.type,
                    x: ev.x || 0,
                    y: ev.y || 0
                }))
            });
        }
        return { message: 'Batch logged successfully', count: events?.length || 0 };
    }
    async endSession(req, body) {
        const userId = req.user.id;
        await this.prisma.session.updateMany({
            where: { id: body.sessionId, userId },
            data: { endTime: new Date() }
        });
        return { message: 'Session closed' };
    }
};
exports.TrackController = TrackController;
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrackController.prototype, "trackEvents", null);
__decorate([
    (0, common_1.Post)('session/end'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrackController.prototype, "endSession", null);
exports.TrackController = TrackController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('track'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackController);
//# sourceMappingURL=track.controller.js.map