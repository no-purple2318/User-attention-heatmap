import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';

const EventSchema = z.object({
    type: z.enum(['mouse', 'scroll', 'eye', 'MOUSE', 'SCROLL', 'EYE']),
    x: z.number(),
    y: z.number(),
    timestamp: z.string().or(z.number()).or(z.date())
});

const IngestSchema = z.object({
    sessionId: z.string().uuid(),
    url: z.string().min(1),
    events: z.array(EventSchema)
});

@UseGuards(AuthGuard('jwt'))
@Controller('track')
export class TrackController {
    constructor(private prisma: PrismaService) { }

    @Post('events')
    async trackEvents(@Req() req: any, @Body() body: any) {
        let parsed;
        try {
            parsed = IngestSchema.parse(body);
        } catch (e) {
            throw new BadRequestException('Invalid Event Payload schema: ' + e);
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

    @Post('session/end')
    async endSession(@Req() req: any, @Body() body: { sessionId: string }) {
        const userId = req.user.id;
        await this.prisma.session.updateMany({
            where: { id: body.sessionId, userId },
            data: { endTime: new Date() }
        });
        return { message: 'Session closed' };
    }
}
