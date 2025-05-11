import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { RepositoryService } from '../common/services/repository/repository.service';

@Injectable()
export class AppointmentService extends RepositoryService<Appointment> {
    constructor(
        @InjectRepository(Appointment)
        repository: Repository<Appointment>,
    ) {
        super(repository);
    }
}
