import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany,
    Index,
    ManyToOne,
    JoinColumn,
    Unique, 
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { InitialEntity } from '../common/entities/initial.entity';
import { LanguageCode } from '../common/enums/language-code.enum';
import { Location } from '../location/location.entity';


@Entity({ schema: 'core', name: 'location_translations' })
@Unique('uq_core_location_translations_location_id_language_code', ['locationId', 'languageCode'])
export class LocationTranslation extends InitialEntity {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_core_location_translations_id' })
    id: number;

    @Column({
        name: 'location_id',
    })
    locationId: number;

    @Column({
        name: 'language_code',
        type: 'enum',
        enum: LanguageCode,
        enumName: 'enum_language_code',
    })
    languageCode: LanguageCode;

    @Column({
        length: 255,
    })
    name: string;

    @ManyToOne(() => Location, location => location.translations)
    @JoinColumn({
        name: 'location_id'
    })
    loaction: Location;
}