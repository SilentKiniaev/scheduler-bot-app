import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { AppointmentModule } from '../appointment/appointment.module';
import { LocationModule } from '../location/location.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        AppointmentModule,
        LocationModule,
        UserModule,
    ],
    providers: [BotUpdate],
    // exports: [BotUpdate],
})
export class BotModule {}
