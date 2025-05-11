import { LanguageCode } from "src/modules/common/enums/language-code.enum";
import { Location } from "../../modules/location/location.entity";
import { MigrationInterface, QueryRunner } from "typeorm"

export class InitLocations1746798050501 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const codes = {
            'us_new_york': {
                code: 'us_new_york',
                languageCode: {
                    [LanguageCode.ENG]: 'USA, New York',
                    [LanguageCode.RU]: 'США, Нью-Йорк'
                }
            },
            'kz_almaty': {
                code: 'kz_almaty',
                languageCode: {
                    [LanguageCode.ENG]: 'Kazakhstan, Almaty',
                    [LanguageCode.RU]: 'Казахстан, Алматы'
                }
            },
            'ru_moscow': {
                code: 'ru_moscow',
                languageCode: {
                    [LanguageCode.ENG]: 'Russia, Moscow',
                    [LanguageCode.RU]: 'Россия, Москва'
                }
            }
        }
        const locations: Location[] = await queryRunner.query(`
            INSERT INTO core.locations
                (code)
            VALUES
                ${Object.keys(codes).map(code => `('${code}')`).join(',\n')} 
            RETURNING id, code
        `);
        await queryRunner.query(`
            INSERT INTO core.location_translations
                (location_id, language_code, name)
            VALUES
                ${locations.reduce((acc, location) => {
                    for (const languageCode in codes[location.code].languageCode)
                        acc.push(`(${location.id}, '${languageCode}', '${codes[location.code].languageCode[languageCode]}')`);
                    return acc;
                }, []).join(',\n')}
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
