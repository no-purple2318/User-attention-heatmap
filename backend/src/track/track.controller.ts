import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { TrackService } from './track.service';

@Controller('track')
export class TrackController {
    constructor(private readonly trackService: TrackService) { }

    @Post('session')
    async startSession(@Body() body: { userId: string, url: string }) {
        if (!body.userId) throw new BadRequestException('User ID is required');
        return this.trackService.createSession(body.userId, body.url);
    }

    @Post('events')
    async trackEvents(@Body() body: { userId: string, sessionId: string; events: any[] }) {
        if (!body.userId) throw new BadRequestException('User ID is required');
        return this.trackService.createEvents(body.userId, body.sessionId, body.events);
    }
}

