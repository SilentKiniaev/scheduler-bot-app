import { 
    Brackets, 
    EntityManager, 
    FindOptionsWhere, 
    ObjectLiteral, 
    Repository, 
    SelectQueryBuilder,
    FindOneOptions,
    FindOptionsOrder,
    OrderByCondition,
    FindOptionsOrderValue,
    FindManyOptions,
    In,
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

type ReadOptionsWhere<T> = string | FindOptionsWhere<T> | Brackets | FindOptionsWhere<T>[] | ((qb: SelectQueryBuilder<T>) => string);
// type ReadOptionsSelect<T> = FindOneOptions<T>['select'];
type ReadOptionsSelect<T> = (keyof T)[] | {
    [P in keyof T]: boolean;
};

type ReadOptionsDelete<T> = ReadOptionsWhere<T> | number | number[];

type ReadOptionsOrderValue = ("ASC" | "DESC") | {
    order: "ASC" | "DESC";
    nulls?: "NULLS FIRST" | "NULLS LAST";
};

type ReadOptionsRelationValue = {
    alias: string;
    path: string;
};

type ReadOptionsOrder<T> = {
    [P in keyof T]: ReadOptionsOrderValue;
}

type ReadOneOptions<T> = {
    where?: ReadOptionsWhere<T>;
    select?: ReadOptionsSelect<T>;
    order?: ReadOptionsOrder<T>;
    relations: (keyof T)[];
};

type ReadManyOptions<T> = ReadOneOptions<T> & {
    skip?: number;
    take?: number;
}

export class RepositoryService<RT> {
    private readonly alias: string;
    constructor(
        protected readonly repository: Repository<RT>,
    ) {
        this.alias = (this.repository.target as Function).name;
    }

    private buildQueryReadOne(
        manager: EntityManager,
        options: ReadOneOptions<RT>,
    ) {
        const metadata = manager.getRepository(this.repository.target).metadata;
        const queryBuilder = manager
            .getRepository(this.repository.target)
            .createQueryBuilder(this.alias);
            
        const selection: string[] = [];
        if (options?.select) {
            if (Array.isArray(options.select))
                selection.push(...options.select.map(propertyName => `${this.alias}.${propertyName as string}`));
            else {
                const hasNegatives = Object.values<boolean>(options.select).every(value => value === false);
                metadata.columns.map(column => {
                    if (hasNegatives && options.select[column.propertyName] !== false)
                        selection.push(`${this.alias}.${column.propertyName}`);
                    else if (options.select[column.propertyName] === true) 
                        selection.push(`${this.alias}.${column.propertyName}`);
                })
            }
        }
        if (!selection.length)
            queryBuilder.select();

        if (options?.where)
            queryBuilder.where(options.where);
        
        if (options?.order)
            queryBuilder.orderBy(options.order)
            
        return queryBuilder;
    }

    private buildQueryReadMany(
        manager: EntityManager,
        options: ReadManyOptions<RT>,
    ) {
        const queryBuilder = this.buildQueryReadOne(manager, options);
        if (options?.skip)
            queryBuilder.skip(options.skip);
        if (options?.take)
            queryBuilder.take(options.take);
        return queryBuilder;
    }

    public async managedReadOne(
        manager: EntityManager,
        options: FindOneOptions<RT> /* ReadOneOptions<RT> */,
    ) {
        // const queryBuilder = this.buildQueryReadOne(manager, options);
        // const item = await queryBuilder.getOne();
        const item = await manager.getRepository(this.repository.target).findOne(options);
        return item;
    }

    public async readOne(
        options: FindOneOptions<RT> /* ReadOneOptions<RT> */,
    ) {
        const item = await this.managedReadOne(this.repository.manager, options);
        return item;
    }

    public async managedReadMany(
        manager: EntityManager,
        options?: FindManyOptions<RT>/* ReadManyOptions<RT> */,
    ) {
        // const queryBuilder = this.buildQueryReadMany(manager, options);
        // const items = await queryBuilder.getMany();
        const items = await manager.getRepository(this.repository.target).find(options)

        return items;
    }

    public async readMany(
        options?: FindManyOptions<RT>/* ReadManyOptions<RT> */,
    ) {
        const items = await this.managedReadMany(
            this.repository.manager,
            options,
        );
        return items;
    }

    public async managedUpsert(
        manager: EntityManager,
        dto: QueryDeepPartialEntity<RT>,
        conflictKeys: string[],
    ) {
        const upsertResult = await manager.upsert(
            this.repository.target,
            dto,
            conflictKeys,
        );
        return upsertResult;
    }

    public async upsert(
        dto: QueryDeepPartialEntity<RT>,
        conflictKeys: string[],
    ) {
        const upsertResult = await this.managedUpsert(
            this.repository.manager, 
            dto, 
            conflictKeys
        );
        return upsertResult;
    }

    public async managedInsert(
        manager: EntityManager,
        dto: QueryDeepPartialEntity<RT> | QueryDeepPartialEntity<RT>[],
    ) {
        const insertResult = await manager
            .getRepository(this.repository.target)
            .createQueryBuilder()
            .insert()
            .values(dto)
            .execute();
        return insertResult
    }

    public async insert(
        dto: QueryDeepPartialEntity<RT> | QueryDeepPartialEntity<RT>[],
    ) {
        const insertResult = await this.managedInsert(
            this.repository.manager,
            dto,
        );
        return insertResult.generatedMaps;
    }

    public async managedSoftRemove(
        manager: EntityManager,
        criteria: ReadOptionsWhere<RT>,
    ) {
        // let where: ReadOptionsWhere<RT> = {};
        // if (typeof criteria === 'number')
        //     where['id'] = criteria;
        // if (Array.isArray(criteria) && criteria.every(item => typeof item === 'number'))
        //     where['id'] = In(criteria);
        // else 
        //     where = criteria;
        const deleteResult = await manager
            .getRepository(this.repository.target)
            .createQueryBuilder()
            .softDelete()
            .where(criteria)
            .execute();

        return deleteResult;
    }

    public async softRemove(
        where: ReadOptionsWhere<RT>,
    ) {
        const deleteResult = await this.managedSoftRemove(
            this.repository.manager, 
            where
        );
        return deleteResult;
    }
}