import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column,
    ManyToOne, 
    JoinColumn 
} from 'typeorm';
import { User } from '../user/user.entity';
import { Location } from '../location/location.entity';
import { InitialEntity } from '../common/entities/initial.entity';

@Entity({ schema: 'core', name: 'appointments' })
export class Appointment extends InitialEntity {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_core_appointments_id' })
    id?: number;

    @Column({ name: 'telegram_id', type: 'int8' })
    telegramId?: number;

    @Column({ name: 'location_id' })
    locationId: number;

    @Column({
        type: 'timestamp with time zone',
        name: 'start_dt' 
    })
    startDt?: Date;

    @Column({ 
        type: 'timestamp with time zone',
        name: 'end_dt' 
    })
    endDt?: Date;

    @ManyToOne(() => User, (user) => user.appointments)
    @JoinColumn({ 
        name: 'telegram_id', 
        referencedColumnName: 'telegramId', 
        foreignKeyConstraintName: 'fk_core_appointments_core_users_telegram_id' 
    })
    user: User;

    @ManyToOne(() => Location, (location) => location.appointments)
    @JoinColumn({ name: 'location_id', foreignKeyConstraintName: 'fk_core_appointments_core_locations_location_id' })
    location: Location;
}