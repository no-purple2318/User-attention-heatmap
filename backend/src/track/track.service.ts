import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackService {
    constructor(private prisma: PrismaService) { }

    async createSession(userId: string, url: string) {
        const session = await this.prisma.session.create({
            data: {
                userId,
                url: url || 'unknown',
            },
        });
        return { sessionId: session.id };
    }

    async createEvents(userId: string, sessionId: string, events: any[]) {
        if (!sessionId || !events || !Array.isArray(events)) {
            throw new BadRequestException('Invalid Session ID or Events payload');
        }

        // Optional: Verify the session belongs to the user
        // We trust JWT, but it's good practice to ensure session ownership
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== userId) {
            throw new BadRequestException('Session mismatch');
        }

        const data = events.map((ev: Record<string, any>) => ({
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
}
