import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentService } from './appointment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
    ],
    providers: [AppointmentService],
    exports: [AppointmentService],
})
export class AppointmentModule {}
