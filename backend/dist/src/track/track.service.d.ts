import { PrismaService } from '../prisma/prisma.service';
export declare class TrackService {
    private prisma;
    constructor(prisma: PrismaService);
    createSession(userId: string, url: string): Promise<{
        sessionId: string;
    }>;
    createEvents(userId: string, sessionId: string, events: any[]): Promise<{
        success: boolean;
        count: number;
    }>;
}
