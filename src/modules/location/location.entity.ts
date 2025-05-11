import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany,
    Index,
    Unique, 
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { InitialEntity } from '../common/entities/initial.entity';
import { LocationTranslation } from '../location-translations/location-translations.entity';

@Entity({ schema: 'core', name: 'locations' })
@Unique('uq_core_locations_code', ['code'])
export class Location extends InitialEntity {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_core_locations_id' })
    id: number;

    @Column({
        name: 'code',
        length: 255,
    })
    code: string;

    @OneToMany(() => Appointment, (appointment) => appointment.location)
    appointments: Appointment[];

    @OneToMany(() => LocationTranslation, translation => translation.loaction)
    translations: LocationTranslation[];
}