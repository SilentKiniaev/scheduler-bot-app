import {
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from 'typeorm';

export class InitialEntity {
    @CreateDateColumn({
        name: 'create_dt',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createDt?: Date;

    @UpdateDateColumn({
        name: 'update_dt',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updateDt?: Date;

    @DeleteDateColumn({
        name: 'delete_dt',
        type: 'timestamptz',
        nullable: true,
    })
    deleteDt?: Date;
}