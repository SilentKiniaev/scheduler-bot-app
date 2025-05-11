import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany, 
    Index, 
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { InitialEntity } from '../common/entities/initial.entity';

@Entity({ schema: 'core', name: 'users' })
export class User extends InitialEntity {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_core_users_id' })
    id?: number;

    @Column({ name: 'full_name', default: null })
    fullName?: string;

    @Column({ name: 'phone_number', default: null })
    phoneNumber?: string;

    @Column({ name: 'telegram_id', type: 'int8', unique: true })
    @Index()
    telegramId?: number;

    @Column({ name: 'telegram_username', default: null })
    telegramUsername?: string;

    @OneToMany(() => Appointment, (appointment) => appointment.user)
    appointments: Appointment[];
}